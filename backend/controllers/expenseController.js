const Expense = require('../models/Expense');

exports.logExpense = async (req, res) => {
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

exports.getExpenseLedger = async (req, res) => {
  try {
    const ledger = await Expense.find()
      .populate('recorded_by', 'name email')
      .sort({ date: -1 });
    res.status(200).json(ledger);
  } catch (error) {
    res.status(500).json({ error: "Failed to compile expense records." });
  }
};