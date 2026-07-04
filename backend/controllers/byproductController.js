const Byproduct = require('../models/Byproduct');

exports.logByproductSale = async (req, res) => {
  const { type, sub_type, quantity, price_per_unit, date } = req.body;
  try {
    const byproduct = await Byproduct.create({
      type,
      sub_type,
      quantity,
      price_per_unit,
      date: date || Date.now(),
      recorded_by: req.user._id
    });
    res.status(201).json({ message: "Byproduct reclamation sale logged successfully.", byproduct });
  } catch (error) {
    res.status(500).json({ error: "Failed to record byproduct transaction metrics." });
  }
};

exports.getByproductLedger = async (req, res) => {
  try {
    const ledger = await Byproduct.find()
      .populate('recorded_by', 'name email')
      .sort({ date: -1 });
    res.status(200).json(ledger);
  } catch (error) {
    res.status(500).json({ error: "Failed to compile byproduct records." });
  }
};