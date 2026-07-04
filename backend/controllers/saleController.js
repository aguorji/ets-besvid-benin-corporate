const Sale = require('../models/Sale');
const ProductItem = require('../models/ProductItem');

// @desc    Log a Wholesale Transaction & Automatically Process Inventory Deductions and Debt Status
// @route   POST /api/sales
// @access  Private
exports.recordSaleTransaction = async (req, res) => {
  const { 
    product_id, 
    production_ref, 
    consignment_id, 
    actual_size, 
    quantity_sold, 
    selling_price, 
    customer_name, 
    payment_type, 
    amount_paid 
  } = req.body;

  try {
    // 1. Verify product category exists
    const product = await ProductItem.findById(product_id);
    if (!product) {
      return res.status(404).json({ error: "Product category catalog entry missing." });
    }

    // 2. Find the exact matching production run variation bale stack in inventory
    const variation = product.stock_variations.find(v => v.production_ref === production_ref);
    if (!variation) {
      return res.status(404).json({ error: `Specific production variation batch [${production_ref}] not found in stock matrix.` });
    }

    // 3. Prevent transaction if stock balances are insufficient
    if (variation.quantity_balance < quantity_sold) {
      return res.status(400).json({ 
        error: `Insufficient Stock Level. Attempted to sell ${quantity_sold} units, but only ${variation.quantity_balance} are remaining in inventory.` 
      });
    }

    // 4. Pull target adjusted pricing model established during production log run
    const targetSetPrice = variation.adj_price;

    // 5. Initialize and process the sale schema record
    const sale = new Sale({
      product_id,
      production_ref,
      consignment_id,
      actual_size,
      quantity_sold,
      set_price: targetSetPrice,
      selling_price,
      customer_name,
      payment_type,
      amount_paid: payment_type === 'Cash' ? 0 : amount_paid, // Schema middleware automatically sets cash bounds
      recorded_by: req.user._id
    });

    // Save sale to trigger performance metric calculation and debt tracking workflows
    await sale.save();

    // 6. DEDUCT INVENTORY BALANCE: Adjust quantities sold directly in parent product document array
    variation.quantity_sold += quantity_sold;
    
    // Save updated parent inventory document (recomputes balances and remaining stock value hooks)
    await product.save();

    res.status(201).json({
      message: "Wholesale transaction executed successfully. Inventory deducted and financial ledgers balanced.",
      sale
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to execute sale transaction ledger processing." });
  }
};

// @desc    Fetch Active Accounts Receivable / Outstanding Customer Debts Ledger
// @route   GET /api/sales/receivables
// @access  Private
exports.getAccountsReceivable = async (req, res) => {
  try {
    const debtorsList = await Sale.find({ debt_status: 'Owing' })
      .populate('product_id', 'name initials')
      .populate('recorded_by', 'name email')
      .sort({ createdAt: -1 });
      
    res.status(200).json(debtorsList);
  } catch (error) {
    res.status(500).json({ error: "Failed to compile active debt ledger matrix." });
  }
};