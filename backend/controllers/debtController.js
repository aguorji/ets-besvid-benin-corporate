import DebtPayment from '../models/DebtPayment.js';
import Sale from '../models/Sale.js';

// @desc    Record a customer debt payment
// @route   POST /api/debts/pay
// @access  Private (Staff & Admin)
export const recordDebtPayment = async (req, res) => {
  const { sale_id, customer_name, amount_paid, payment_method, notes } = req.body;

  try {
    const sale = await Sale.findById(sale_id);
    if (!sale) {
      return res.status(404).json({ error: 'Associated invoice record not found.' });
    }

    const paymentAmount = Number(amount_paid);

    // Save the payment transaction receipt
    const payment = await DebtPayment.create({
      sale_id,
      customer_name: customer_name || sale.customer_name,
      amount_paid: paymentAmount,
      payment_method: payment_method || 'Cash',
      notes,
      recorded_by: req.user._id // Extracted directly from JWT middleware
    });

    // Update parent sale invoice balance and debt status
    sale.amount_paid += paymentAmount;
    sale.balance = Math.max(0, sale.gross_revenue - sale.amount_paid);
    sale.debt_status = sale.balance === 0 ? 'Settled' : 'Owing';
    await sale.save();

    return res.status(201).json({
      message: 'Debt payment successfully registered.',
      payment,
      updatedInvoiceBalance: sale.balance,
      debtStatus: sale.debt_status
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Get all payments history (Admin view)
// @route   GET /api/debts/history
// @access  Private
export const getDebtPaymentHistory = async (req, res) => {
  try {
    const history = await DebtPayment.find()
      .populate('recorded_by', 'name email')
      .sort({ createdAt: -1 });
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};