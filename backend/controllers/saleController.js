// backend/controllers/saleController.js
import Sale from '../models/Sale.js';
import ProductItem from '../models/ProductItem.js';

// @desc     Log a Wholesale Transaction & Automatically Process Inventory Deductions and Debt Status
// @route    POST /api/sales
// @access   Private
export const recordSaleTransaction = async (req, res) => {
  const {
    customer_name,
    payment_type,
    amount_paid,
    items // 👈 Expecting an array of items now: [{ product_id, production_ref, consignment_id, actual_size, quantity_sold, selling_price, is_adjusted_bale }]
  } = req.body;

  try {
    // 1. Validation check
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "An invoice must contain at least one item line." });
    }

    const processedItems = [];

    // 2. Loop through each item in the order to verify stock and deduct inventory
    for (const item of items) {
      const product = await ProductItem.findById(item.product_id);
      if (!product) {
        return res.status(404).json({ error: `Product category entry missing for ID: ${item.product_id}` });
      }

      // Find matching production batch variation stack
      const variation = product.stock_variations.find(v => v.production_ref === item.production_ref);
      if (!variation) {
        return res.status(404).json({ error: `Specific production variation batch [${item.production_ref}] not found in stock matrix.` });
      }

      // Prevent transaction if stock balances are insufficient
      if (variation.quantity_balance < item.quantity_sold) {
        return res.status(400).json({
          error: `Insufficient Stock Level for ${product.product_name || 'Item'}. Attempted to sell ${item.quantity_sold} units, but only ${variation.quantity_balance} are remaining.`
        });
      }

      // Deduct inventory balance
      variation.quantity_sold += item.quantity_sold;
      await product.save();

      // Build out the item row with the database's target set price included
      processedItems.push({
        product_id: item.product_id,
        production_ref: item.production_ref,
        consignment_id: item.consignment_id,
        actual_size: item.actual_size,
        quantity_sold: item.quantity_sold,
        set_price: variation.adj_price, // Pulled dynamically from inventory setup
        selling_price: item.selling_price,
        is_adjusted_bale: item.is_adjusted_bale || false
      });
    }

    // 3. Initialize and save the multi-item sale document
    const sale = new Sale({
      customer_name,
      payment_type,
      amount_paid: payment_type === 'Cash' ? 0 : amount_paid, // Schema middleware automatically sets cash bounds
      items: processedItems,
      recorded_by: req.user._id
    });

    // Save sale to trigger schema pre-save math (revenue, variance, performance, debt_status)
    await sale.save();

    res.status(201).json({
      message: "Wholesale transaction executed successfully. Inventory deducted and financial ledgers balanced.",
      sale
    });
  } catch (error) {
    console.error("Sale transaction processing failed:", error);
    res.status(500).json({ error: "Failed to execute sale transaction ledger processing." });
  }
};

// @desc     Fetch Active Accounts Receivable / Outstanding Customer Debts Ledger
// @route    GET /api/sales/receivables
// @access   Private
export const getAccountsReceivable = async (req, res) => {
  try {
    const debtorsList = await Sale.find({ debt_status: 'Owing' })
      .populate('items.product_id', 'product_name product_code')
      .populate('recorded_by', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(debtorsList);
  } catch (error) {
    res.status(500).json({ error: "Failed to compile active debt ledger matrix." });
  }
};

// @desc     Get all sales records with full audit population for the Admin Dashboard console
// @route    GET /api/sales
// @access   Private
// 👈 Missing Dashboard function added below
export const getAllSalesTransactions = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('recorded_by', 'name role')
      .populate('items.product_id', 'product_name product_code')
      .sort({ createdAt: -1 });

    res.status(200).json(sales);
  } catch (error) {
    console.error('Error fetching dashboard sales logs:', error);
    res.status(500).json({ message: 'Server error: Unable to retrieve transaction audit streams.' });
  }
};