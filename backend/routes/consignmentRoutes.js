// backend/routes/consignmentRoutes.js
import express from 'express';
import mongoose from 'mongoose';

// Ensure these paths match your files inside backend/models/ exactly
import Consignment from '../models/Consignment.js';
import Sale from '../models/Sale.js'; 
import Expense from '../models/Expense.js';
import Byproduct from '../models/Byproduct.js';
import DebtPayment from '../models/DebtPayment.js';
import ProductItem from '../models/ProductItem.js'; // Added for Product Catalog Sync
import AuditLog from '../models/AuditLog.js';
import { debugConsignment } from '../controllers/consignmentController.js'; // Added for debugging
import { protectRoute, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Every route in this file previously had NO authentication at all —
// anyone who knew the URL could create, read, or modify consignment and
// production data with zero login. This requires a valid token for
// everything below; adminOnly is added additionally on the two routes that
// should be restricted the same way the UI already restricts them
// (consignment creation, financial reconciliation).
router.use(protectRoute);

// Writes an audit entry. Failures here are logged but never block or fail
// the actual operation they're describing — an audit trail is a nice-to-have
// record, not something that should be able to break a real transaction.
async function logAudit({ operator_name, action_module, details, value_impact }) {
  try {
    await AuditLog.create({ operator_name, action_module, details, value_impact });
  } catch (e) {
    console.error('Failed to write audit log entry:', e.message);
  }
}

// ProductItem's unit field is a strict enum of 'KGS' or 'PCS', but Excel
// data commonly has values like "KGS per Bale" — normalize before saving,
// or ProductItem.create() throws a validation error for any new itemCode.
function normalizeUnit(rawUnit) {
  const u = (rawUnit || '').toUpperCase();
  return u.includes('PCS') ? 'PCS' : 'KGS';
}

// Helper function to sync consignment production items into the master ProductItem catalog
async function syncProductionToProducts(productionItems, consignmentRef, consignmentId) {
  if (!productionItems || !Array.isArray(productionItems)) return;

  for (const row of productionItems) {
    const itemCode = (row.itemCode || '').toUpperCase().trim();
    if (!itemCode) continue;

    const actualSize = Number(row.actualSize || row.standardSize || 0);
    const standardSize = Number(row.standardSize || 0);
    const quantityBales = Number(row.balesQuantity || row.quantity || 0);
    const basePrice = Number(row.priceStd || row.price || 0);
    const adjPrice = Number(row.adjustedPrice || basePrice);
    // ProductItem.VariationSchema requires size_type — derive it instead of
    // omitting it (which previously failed schema validation on every row).
    const sizeType = (actualSize && standardSize && actualSize !== standardSize)
      ? 'adjusted'
      : 'standard';

    // Unique per item + actual size within this consignment. Using just
    // consignmentRef (the old behavior) collided across every item in the
    // batch, since production_ref carries a UNIQUE index across the whole
    // productitems collection, not just within one product — only the first
    // item in any consignment could ever have been saved successfully.
    const productionRef = `${consignmentRef}-${itemCode}-${actualSize}`;

    try {
      // 1. Find the root product or create it if it doesn't exist yet
      let product = await ProductItem.findOne({ itemCode });

      if (!product) {
        product = await ProductItem.create({
          itemCode,
          description: row.description || itemCode,
          unit: normalizeUnit(row.unit),
          standardSize: standardSize || actualSize || 0,
          basePrice,
          stock_variations: []
        });
      } else {
        // Per your decision: master catalog fields (description/unit/
        // standardSize) are frozen once set, not silently overwritten by
        // later consignments — that's the same "silent overwrite" pattern
        // that caused several of tonight's bugs. A mismatch gets flagged in
        // the audit log instead, so a human can decide whether it's a real
        // change or a data-entry typo. basePrice is treated as a rolling
        // reference/default price and IS allowed to update, since batch
        // pricing legitimately varies — actual per-batch pricing always
        // lives correctly on stock_variations regardless.
        const mismatches = [];
        if (row.description && row.description !== itemCode && product.description !== row.description) {
          mismatches.push(`description ("${product.description}" vs "${row.description}")`);
        }
        const incomingUnit = normalizeUnit(row.unit);
        if (incomingUnit && product.unit !== incomingUnit) {
          mismatches.push(`unit ("${product.unit}" vs "${incomingUnit}")`);
        }
        if (standardSize && product.standardSize !== standardSize) {
          mismatches.push(`standardSize (${product.standardSize} vs ${standardSize})`);
        }

        if (mismatches.length > 0) {
          await logAudit({
            operator_name: 'System',
            action_module: 'Catalog Conflict',
            details: `${itemCode} in ${consignmentRef} disagrees with existing catalog on: ${mismatches.join(', ')}. Catalog left unchanged — review and update manually if this is a genuine change, not a typo.`,
            value_impact: 0
          });
        }

        if (basePrice) product.basePrice = basePrice;
      }

      // 2. Check if this specific batch reference already exists in stock_variations
      const existingBatchIndex = product.stock_variations.findIndex(
        v => v.production_ref === productionRef
      );

      if (existingBatchIndex > -1) {
        // Update existing batch balance
        const v = product.stock_variations[existingBatchIndex];
        v.quantity_produced = quantityBales;
        v.quantity_balance = quantityBales;
        v.base_price = basePrice;
        v.adj_price = adjPrice;
        v.size_type = sizeType;
        if (consignmentId) v.consignment_id = consignmentId;
      } else {
        // Push new batch/consignment variation — consignment_id, size_type,
        // and adj_price are all required by the schema and were previously
        // missing, which silently failed validation on every single row.
        product.stock_variations.push({
          production_ref: productionRef,
          consignment_id: consignmentId,
          actual_size: actualSize,
          size_type: sizeType,
          quantity_produced: quantityBales,
          quantity_balance: quantityBales, // Crucial for terminal stock checking!
          base_price: basePrice,
          adj_price: adjPrice
        });
      }

      await product.save();
    } catch (err) {
      // One bad row is now logged and skipped instead of silently killing
      // the sync for every remaining item in the batch.
      console.error(`syncProductionToProducts failed for itemCode "${itemCode}" (ref: ${productionRef}):`, err.message);
    }
  }
}

// GET: Stream all raw active manifests down to the dashboard run timeline
router.get('/', async (req, res) => {
  try {
    const list = await Consignment.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DEBUG GET ROUTE FOR AA-22-26
router.get('/debug/aa2226', debugConsignment);

// POST: Parse manifest input structures securely into MongoDB instance & sync catalog
router.post('/', adminOnly, async (req, res) => {
  try {
    const consignmentRef = req.body.consignment_ref;
    const productionItems = req.body.production_items || [];

    const newManifest = new Consignment({
      consignment_ref: consignmentRef,
      vessel_identity: req.body.vessel_identity || '',
      type: req.body.type,
      total_volume_count: Number(req.body.total_volume_count) || 0,
      total_gross_weight: Number(req.body.total_gross_weight) || 0,
      total_landing_cost: Number(req.body.total_landing_cost) || 0,
      currency: req.body.currency || '₦',
      status: req.body.status || 'active',
      production_items: productionItems
    });

    const saved = await newManifest.save();

    // 🔄 Automatically sync items to the Product Catalog for the Staff Terminal
    await syncProductionToProducts(productionItems, consignmentRef, saved._id);

    await logAudit({
      operator_name: req.body.vessel_identity || 'System',
      action_module: 'Consignment Intake',
      details: `New consignment registered: ${consignmentRef}`,
      value_impact: Number(req.body.total_landing_cost) || 0
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT: Standard Manifest Profile Update Route
router.put('/:id', async (req, res) => {
  try {
    const updated = await Consignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Manifest profile missing from data trees.' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET: Core Financial Reconciliation and Combined Ledger Processing Matrix
async function getReconciliation(req, res) {
  try {
    const cId = new mongoose.Types.ObjectId(req.params.id);
    const manifest = await Consignment.findById(cId);
    if (!manifest) return res.status(404).json({ message: 'Target profile missing from ledger trees.' });

    const sales = await Sale.find({ 'items.consignment_id': cId });
    const expenses = await Expense.find({ consignment_id: cId });
    const byproducts = await Byproduct.find({ consignment_id: cId });

    let totalBaleRevenue = 0;
    let totalDebt = 0;
    let totalReceivedCash = 0;

    sales.forEach(sale => {
      // Sale.js's pre('save') hook already computes gross_revenue,
      // amount_paid, balance, and debt_status correctly per invoice — no
      // need to recompute from item fields that used the wrong names
      // (qty/sellingPrice/paymentStatus/amountPaid instead of
      // quantity_sold/selling_price/payment_type/amount_paid).
      totalBaleRevenue += sale.gross_revenue || 0;

      if (sale.debt_status === 'Owing') {
        totalReceivedCash += sale.amount_paid || 0;
        totalDebt += sale.balance || 0;
      } else {
        totalReceivedCash += sale.amount_paid || 0;
      }
    });

    let byproductRevenue = byproducts.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
    const totalRevenue = totalBaleRevenue + byproductRevenue;

    const aggregateExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalCost = (manifest.total_landing_cost || 0) + aggregateExpenses;

    const production = manifest.production_items || [];
    
    const stockMatrix = production.map(item => {
      let totalBalesSold = 0;
      sales.forEach(sale => {
        (sale.items || []).forEach(invItem => {
          if (invItem.item_name === item.itemCode && String(invItem.actual_size) === String(item.actualSize)) {
            totalBalesSold += (invItem.quantity_sold || 0);
          }
        });
      });

      const remainingBales = Math.max(0, (item.balesQuantity || 0) - totalBalesSold);
      const itemTotalValue = (item.balesQuantity || 0) * (item.adjustedPrice || item.priceStd || 0);

      return {
        itemCode: item.itemCode,
        unit: item.unit || 'PCS',
        standardSize: item.standardSize || 0,
        actualSize: item.actualSize || 0,
        priceStd: item.priceStd || 0,
        adjustedPrice: item.adjustedPrice || item.priceStd || 0,
        balesQuantity: item.balesQuantity || 0,
        totalValue: itemTotalValue,
        sold: totalBalesSold,
        remaining: remainingBales,
        stockAssetValue: remainingBales * (item.adjustedPrice || item.priceStd || 0)
      };
    });

    const stockValue = stockMatrix.reduce((acc, curr) => acc + curr.stockAssetValue, 0);
    const netProfit = totalRevenue - totalCost;
    const realCashPosition = (totalReceivedCash + byproductRevenue) - aggregateExpenses;

    res.json({
      manifest,
      financials: {
        totalBaleRevenue,
        byproductRevenue,
        totalRevenue,
        stockValue,
        totalExpenses: aggregateExpenses,
        totalCost,
        totalDebt,
        netProfit,
        realCashPosition
      },
      ledgers: {
        production,
        sales,
        byproducts,
        expenses,
        stock: stockMatrix
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Mounted at both paths: /reconciliation/:id is the original route, and
// /:id/reconciliation is what ConsignmentReconciliation.jsx actually calls
// (apiClient.get(`/consignments/${id}/reconciliation`)) — these never
// matched each other, so the frontend's reconciliation fetch was silently
// 404ing regardless of what data existed.
router.get('/reconciliation/:id', adminOnly, getReconciliation);
router.get('/:id/reconciliation', adminOnly, getReconciliation);

// PUT: Direct Production Update Interface Core Override & Sync Catalog
router.put('/:id/production', async (req, res) => {
  try {
    const { production_items } = req.body;
    const consignmentId = req.params.id;

    const consignment = await Consignment.findById(consignmentId);
    if (!consignment) return res.status(404).json({ message: 'Consignment not found.' });

    consignment.production_items = production_items;
    const updated = await consignment.save();

    // 🔄 Sync updated production items to Product Catalog
    await syncProductionToProducts(production_items, consignment.consignment_ref, consignment._id);

    await logAudit({
      operator_name: 'System',
      action_module: 'Production Ledger',
      details: `Production items updated for ${consignment.consignment_ref}: ${production_items.length} row(s)`,
      value_impact: 0
    });

    res.json({ message: 'Production matrix layers aligned successfully.', updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST: Log Customer Multi-Item Invoice Entry
router.post('/:id/invoice', async (req, res) => {
  try {
    const cId = new mongoose.Types.ObjectId(req.params.id);
    const rawItems = req.body.items || [];

    // Sale.js's real schema uses different field names than what this route
    // previously sent — customer_name (not customerName), payment_type (not
    // paymentStatus), item_name/quantity_sold/selling_price per item (not
    // itemCode/qty/sellingPrice), and consignment_id lives per-item, not at
    // the top level. recorded_by is required and was never supplied at all,
    // which alone would fail validation on every single invoice.
    const newInvoice = new Sale({
      customer_name: req.body.customerName || req.body.customer_name || 'Cash Customer',
      date: req.body.date || new Date(),
      payment_type: req.body.paymentType || req.body.payment_type || 'Cash',
      amount_paid: Number(req.body.amountPaid ?? req.body.amount_paid) || 0,
      recorded_by: req.user._id,
      items: rawItems.map(item => ({
        consignment_id: cId,
        item_name: item.itemCode || item.item_name,
        actual_size: item.actualSize ?? item.actual_size,
        quantity_sold: Number(item.qty ?? item.quantity_sold) || 1,
        set_price: Number(item.basePrice ?? item.set_price) || 0,
        selling_price: Number(item.sellingPrice ?? item.selling_price) || 0
      }))
    });
    await newInvoice.save();

    // Decrement actual stock. Previously nothing here ever touched
    // ProductItem — stock numbers on /products, the Production Ledger, and
    // General Stock export all reflected what was PRODUCED, never what was
    // actually sold, regardless of how many invoices were logged.
    for (const item of newInvoice.items) {
      const code = (item.item_name || '').toUpperCase().trim();
      const qtySold = item.quantity_sold || 0;
      if (!code || qtySold === 0) continue;

      const product = await ProductItem.findOne({ itemCode: code });
      if (!product) continue;

      let variation = product.stock_variations.find(
        v => item.actual_size != null && v.actual_size === Number(item.actual_size) && v.quantity_balance > 0
      );
      if (!variation) {
        variation = product.stock_variations.find(v => v.quantity_balance > 0);
      }

      if (variation) {
        variation.quantity_sold = (variation.quantity_sold || 0) + qtySold;
        await product.save();
      } else {
        console.warn(`Sale recorded for ${code} but no stock_variation with remaining balance was found to decrement.`);
      }
    }

    await logAudit({
      operator_name: req.user.name || req.user.email,
      action_module: 'Sales Ledger',
      details: `Invoice for ${newInvoice.customer_name}: ${newInvoice.items.length} item line(s)`,
      value_impact: newInvoice.gross_revenue
    });

    res.status(201).json(newInvoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST: Record Standalone Loose Byproduct Sales Output
router.post('/:id/byproduct-sale', async (req, res) => {
  try {
    const cId = new mongoose.Types.ObjectId(req.params.id);
    // Byproduct.js's real fields are quantity/price_per_unit/sub_type, not
    // qty/pricePerKg/subType — and consignment_id and recorded_by are both
    // required but were never supplied at all before.
    const newSale = new Byproduct({
      consignment_id: cId,
      date: req.body.date || new Date(),
      type: req.body.type,
      sub_type: req.body.subType || req.body.sub_type || '',
      quantity: Number(req.body.qty ?? req.body.quantity) || 0,
      price_per_unit: Number(req.body.pricePerKg ?? req.body.price_per_unit) || 0,
      recorded_by: req.user._id
    });
    await newSale.save();

    await logAudit({
      operator_name: req.user.name || req.user.email,
      action_module: 'Byproduct Sales',
      details: `${newSale.type} (${newSale.sub_type || 'N/A'}): ${newSale.quantity} units`,
      value_impact: newSale.revenue
    });

    res.status(201).json(newSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST: Add Operational Expense Manifest Layout Line
router.post('/:id/expense', async (req, res) => {
  try {
    const cId = new mongoose.Types.ObjectId(req.params.id);
    // consignment_id and recorded_by are both required but were never
    // supplied before — every expense submission has been failing to save.
    // category must exactly match one of Expense.js's 6 enum values; if the
    // frontend's free-text input doesn't match one exactly, this will
    // correctly reject it rather than silently drop the field.
    const newExpense = new Expense({
      consignment_id: cId,
      date: req.body.date || new Date(),
      category: req.body.category,
      description: req.body.description,
      amount: Number(req.body.amount) || 0,
      recorded_by: req.user._id
    });
    await newExpense.save();

    await logAudit({
      operator_name: req.user.name || req.user.email,
      action_module: 'Operational Expenses',
      details: `${newExpense.category}: ${newExpense.description}`,
      value_impact: newExpense.amount
    });

    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT: Debt Repayment Balance Ledger Update Router
// Previously this directly mutated target.amountPaid, a field that doesn't
// exist on Sale.js's real schema (amount_paid, snake_case) — Mongoose
// silently dropped it on save, so every repayment through this route has
// been lost. A proper DebtPayment model already exists (see debtRoutes.js)
// but was never used here — this now creates a real DebtPayment record and
// updates the Sale's actual amount_paid field correctly.
router.put('/:id/invoice/:invoiceId/repay', async (req, res) => {
  try {
    const target = await Sale.findById(req.params.invoiceId);
    if (!target) return res.status(404).json({ message: 'Invoice record context vanished.' });

    const newDeposit = Number(req.body.depositAmount) || 0;

    await DebtPayment.create({
      sale_id: target._id,
      customer_name: target.customer_name,
      amount_paid: newDeposit,
      payment_method: req.body.paymentMethod || 'Cash',
      notes: req.body.notes || '',
      recorded_by: req.user._id
    });

    target.amount_paid = (target.amount_paid || 0) + newDeposit;
    // balance and debt_status are recalculated by Sale's own pre('save') hook
    await target.save();

    await logAudit({
      operator_name: req.user.name || req.user.email,
      action_module: 'Debt Repayment',
      details: `Repayment for ${target.customer_name}'s invoice ${target._id}`,
      value_impact: newDeposit
    });

    res.json({ message: 'Financial repayment ledger cleared.', target });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;