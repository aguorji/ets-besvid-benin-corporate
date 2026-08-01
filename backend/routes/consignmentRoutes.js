import express from 'express';
import mongoose from 'mongoose';

// Ensure these paths match your files inside backend/models/ exactly
import Consignment from '../models/Consignment.js';
import Sale from '../models/Sale.js'; 
import Expense from '../models/Expense.js';
import Byproduct from '../models/Byproduct.js';

const router = express.Router();

// GET: Stream all raw active manifests down to the dashboard run timeline
// Matches: GET /api/consignments
router.get('/', async (req, res) => {
  try {
    const list = await Consignment.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST: Parse manifest input structures securely into MongoDB instance
// Matches: POST /api/consignments
router.post('/', async (req, res) => {
  try {
    const newManifest = new Consignment({
      consignment_ref: req.body.consignment_ref,
      vessel_name: req.body.vessel_name,
      type: req.body.type,               // 'giant_bale' or 'direct_container'
      sub_type: req.body.sub_type || '', // 'Shoes', 'Bags', etc.
      total_bales_received: Number(req.body.total_bales_received) || 0,
      total_weight_received: Number(req.body.total_weight_received) || 0,
      total_landing_cost: Number(req.body.total_landing_cost) || 0,
      status: req.body.status || 'active',
      production_items: req.body.production_items || [],
      byproducts_yielded: req.body.byproducts_yielded || []
    });

    const saved = await newManifest.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT: Standard Manifest Profile Update Route (Kept from original to prevent frontend breakage)
// Matches: PUT /api/consignments/:id
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
// Matches: GET /api/consignments/reconciliation/:id
router.get('/reconciliation/:id', async (req, res) => {
  try {
    const cId = new mongoose.Types.ObjectId(req.params.id);
    const manifest = await Consignment.findById(cId);
    if (!manifest) return res.status(404).json({ message: 'Target profile missing from ledger trees.' });

    // Fetch child items tied to this specific consignment ID
    const sales = await Sale.find({ consignmentId: cId });
    const expenses = await Expense.find({ consignmentId: cId });
    const byproducts = await Byproduct.find({ consignmentId: cId });

    // 1. Calculate Financial Matrices
    let totalBaleRevenue = 0;
    let totalDebt = 0;
    let totalReceivedCash = 0;

    sales.forEach(sale => {
      // Handle array items if structured as multi-item invoices, otherwise fall back to single records
      const invoiceItems = sale.items || [{ qty: sale.qty, sellingPrice: sale.sellingPrice }];
      let invoiceTotal = invoiceItems.reduce((sum, item) => sum + ((item.qty || 0) * (item.sellingPrice || 0)), 0);
      
      totalBaleRevenue += invoiceTotal;
      
      if (sale.paymentStatus === 'Debt' || sale.paymentStatus === 'Partial') {
        const deposit = sale.amountPaid || 0;
        totalReceivedCash += deposit;
        totalDebt += (invoiceTotal - deposit);
      } else {
        totalReceivedCash += invoiceTotal;
      }
    });

    let byproductRevenue = byproducts.reduce((acc, curr) => acc + ((curr.qty || 0) * (curr.pricePerKg || curr.price || 0)), 0);
    const totalRevenue = totalBaleRevenue + byproductRevenue;

    const aggregateExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalCost = (manifest.total_landing_cost || 0) + aggregateExpenses;

    // 2. Generate Production Matrix from database
    const production = manifest.production_items || [];
    
    // 3. Compute Live Stock Status Framework
    const stockMatrix = production.map(item => {
      let totalBalesSold = 0;
      sales.forEach(sale => {
        const invoiceItems = sale.items || [{ itemCode: sale.itemCode, qty: sale.qty }];
        invoiceItems.forEach(invItem => {
          if (invItem.itemCode === item.itemCode && String(invItem.actualSize) === String(item.actualSize)) {
            totalBalesSold += (invItem.qty || 0);
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
});

// PUT: Direct Production Update Interface Core Override
// Matches: PUT /api/consignments/:id/production
router.put('/:id/production', async (req, res) => {
  try {
    const { production_items } = req.body;
    const updated = await Consignment.findByIdAndUpdate(
      req.params.id,
      { $set: { production_items: production_items } },
      { new: true }
    );
    res.json({ message: 'Production matrix layers aligned successfully.', updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST: Log Customer Multi-Item Invoice Entry
// Matches: POST /api/consignments/:id/invoice
router.post('/:id/invoice', async (req, res) => {
  try {
    const cId = new mongoose.Types.ObjectId(req.params.id);
    const newInvoice = new Sale({
      consignmentId: cId,
      customerName: req.body.customerName || 'Cash Customer',
      date: req.body.date || new Date(),
      items: req.body.items || [], // Array containing: { itemCode, actualSize, qty, sellingPrice }
      paymentStatus: req.body.paymentStatus || 'Paid', // Paid, Debt, Partial
      amountPaid: Number(req.body.amountPaid) || 0
    });
    await newInvoice.save();
    res.status(201).json({ message: 'Multi-item transactional invoice submitted successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST: Record Standalone Loose Byproduct Sales Output
// Matches: POST /api/consignments/:id/byproduct-sale
router.post('/:id/byproduct-sale', async (req, res) => {
  try {
    const cId = new mongoose.Types.ObjectId(req.params.id);
    const newSale = new Byproduct({
      consignmentId: cId,
      date: req.body.date || new Date(),
      type: req.body.type,
      subType: req.body.subType || '',
      qty: Number(req.body.qty) || 0,
      pricePerKg: Number(req.body.pricePerKg) || 0
    });
    await newSale.save();
    res.status(201).json({ message: 'Byproduct commercial run logs indexed.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST: Add Operational Expense Manifest Layout Line
// Matches: POST /api/consignments/:id/expense
router.post('/:id/expense', async (req, res) => {
  try {
    const cId = new mongoose.Types.ObjectId(req.params.id);
    const newExpense = new Expense({
      consignmentId: cId,
      date: req.body.date || new Date(),
      category: req.body.category,
      description: req.body.description,
      amount: Number(req.body.amount) || 0
    });
    await newExpense.save();
    res.status(201).json({ message: 'Expense run line written.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT: Debt Repayment Balance Ledger Update Router
// Matches: PUT /api/consignments/:id/invoice/:invoiceId/repay
router.put('/:id/invoice/:invoiceId/repay', async (req, res) => {
  try {
    const target = await Sale.findById(req.params.invoiceId);
    if (!target) return res.status(404).json({ message: 'Invoice record context vanished.' });

    const newDeposit = Number(req.body.depositAmount) || 0;
    target.amountPaid = (target.amountPaid || 0) + newDeposit;
    
    // If outstanding balance is covered, update the status automatically
    // items calculations can be done or manually tracked depending on UI implementation
    await target.save();
    res.json({ message: 'Financial repayment ledger cleared.', target });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;