import Product from '../models/Product.js';
import Consignment from '../models/Consignment.js';
import Sale from '../models/Sale.js'; 

// Main transaction execution engine matching your routes
export const recordSaleTransaction = async (req, res) => {
  // Destructure incoming payload
  const { 
    customerName, 
    date, 
    items, 
    paymentType,  
    amountPaid
  } = req.body; 

  // Direct context bridge: Securely extract user ID from auth middleware token payload
  const recordedBy = req.user.id;

  try {
    const processingInvoiceItems = [];

    // Loop through each item to validate inventory and prepare schema input
    for (const item of items) {
      const { 
        productId, 
        itemCode, 
        consignmentRef, 
        quantitySold, 
        actualWeight, 
        sellingPricePerBale 
      } = item;

      // 1. Validate product catalog existence
      const productDoc = await Product.findById(productId);
      if (!productDoc) {
        return res.status(404).json({ message: `Product code ${itemCode} not found in catalog.` });
      }

      // 2. Locate the specific stock batch variation
      const stockVariation = productDoc.stock_variations.find(
        v => v.production_ref === consignmentRef
      );

      if (!stockVariation) {
        return res.status(400).json({ 
          message: `Inventory Error: No stock batch found for ${itemCode} under consignment ${consignmentRef}.` 
        });
      }

      // 3. Prevent stock overselling
      if (stockVariation.available_bales < quantitySold) {
        return res.status(400).json({ 
          message: `Insufficient Stock: ${itemCode} (${consignmentRef}) has only ${stockVariation.available_bales} bales left, requested ${quantitySold}.` 
        });
      }

      // 4. Locate target baseline price from product data or fall back to selling price
      const targetSetPrice = productDoc.targetPrice || sellingPricePerBale;
      const nominalStandardSize = productDoc.standardSize || 55;

      // Deduct stock from catalog and save variation change
      stockVariation.available_bales -= quantitySold;
      await productDoc.save();

      // Find the Mongo ID of the consignment to fill the schema schema link
      const consignmentDoc = await Consignment.findOne({ consignment_ref: consignmentRef });
      const consignmentId = consignmentDoc ? consignmentDoc._id : productId; // Safe structural fallback

      // Push sanitized data mapping directly to your SaleItemSchema attributes
      processingInvoiceItems.push({
        product_id: productId,
        production_ref: consignmentRef,
        consignment_id: consignmentId,
        is_adjusted_bale: actualWeight && Number(actualWeight) !== (quantitySold * nominalStandardSize) ? true : false,
        actual_size: actualWeight || (quantitySold * nominalStandardSize),
        quantity_sold: quantitySold,
        set_price: targetSetPrice,
        selling_price: sellingPricePerBale
      });
    }

    // 5. Instantiation & Hook Automation Trigger
    // The pre('save') hook in Sale.js catches this array, executes the Weight Variance engine,
    // and automates gross revenue, margins, and financial aging.
    const newSaleRecord = new Sale({
      customer_name: customerName,
      date: date || new Date(),
      items: processingInvoiceItems,
      payment_type: paymentType || 'Cash',
      amount_paid: amountPaid || 0,
      recorded_by: recordedBy 
    });

    await newSaleRecord.save();

    return res.status(201).json({
      success: true,
      message: "Wholesale transaction executed successfully!",
      invoiceId: newSaleRecord._id,
      data: {
        gross_revenue: newSaleRecord.gross_revenue,
        balance: newSaleRecord.balance,
        debt_status: newSaleRecord.debt_status,
        items: newSaleRecord.items
      }
    });

  } catch (error) {
    console.error("Critical error inside Sales processing engine:", error);
    return res.status(500).json({ message: "Internal Server Processing Error", error: error.message });
  }
};

// Fetch all sales ordered by latest entries
export const getAllSalesTransactions = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    return res.status(200).json(sales);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Live accounts receivable endpoint querying active debts
export const getAccountsReceivable = async (req, res) => {
  try {
    const outstandingDebts = await Sale.find({ debt_status: 'Owing' }).sort({ date: 1 });
    
    const totalOutstandingAmount = outstandingDebts.reduce((sum, sale) => sum + sale.balance, 0);

    return res.status(200).json({ 
      success: true,
      total_outstanding: totalOutstandingAmount,
      debtor_count: outstandingDebts.length,
      debtors: outstandingDebts
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};