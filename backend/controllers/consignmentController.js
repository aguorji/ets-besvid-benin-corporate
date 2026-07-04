const Consignment = require('../models/Consignment');

// @desc    Record a New Consignment & Initialize its Cost Pool
// @route   POST /api/consignments
// @access  Private
exports.createConsignment = async (req, res) => {
  const { consignment_ref, arrival_date, description, purchase_price, shipping_freight, port_clearing, transport } = req.body;

  try {
    const existingRef = await Consignment.findOne({ consignment_ref });
    if (existingRef) {
      return res.status(400).json({ error: "A shipment with this reference code already exists." });
    }

    const consignment = await Consignment.create({
      consignment_ref,
      arrival_date,
      description,
      cost_pool: {
        purchase_price: purchase_price || 0,
        shipping_freight: shipping_freight || 0,
        port_clearing: port_clearing || 0,
        transport: transport || 0
      },
      recorded_by: req.user._id // Automatically logs which staff member entered the record
    });

    res.status(201).json({
      message: "Consignment cost pool initialized successfully.",
      consignment
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to initialize consignment log matrix." });
  }
};

// @desc    Fetch All Active Consignments
// @route   GET /api/consignments
// @access  Private
exports.getAllConsignments = async (req, res) => {
  try {
    const consignments = await Consignment.find()
      .populate('recorded_by', 'name email')
      .sort({ arrival_date: -1 });

    res.status(200).json(consignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to compile active consignment records." });
  }
};