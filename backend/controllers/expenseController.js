import Expense from '../models/Expense.js';

// @desc     Log an Operational Overhead Expense
// @route    POST /api/expenses
// @access   Private
export const logExpense = async (req, res) => {
  const { category, description, amount, date } = req.body;
  try {
    const expense = await Expense.create({
      category,
      description,
      amount,
      date: date || Date.now(),
      recorded_by: req.user._id
    });
    res.status(201).json({ message: "Operational expense logged successfully.", expense });
  } catch (error) {
    res.status(500).json({ error: "Failed to log operational expense metrics." });
  }
};

// @desc     Fetch Complete Operational Expense Ledger
// @route    GET /api/expenses
// @access   Private
export const getExpenseLedger = async (req, res) => {
  try {
    const ledger = await Expense.find()
      .populate('recorded_by', 'name email')
      .sort({ date: -1 });
    res.status(200).json(ledger);
  } catch (error) {
    res.status(500).json({ error: "Failed to compile expense records." });
  }
};
