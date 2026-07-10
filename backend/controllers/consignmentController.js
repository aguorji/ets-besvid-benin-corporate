import Consignment from '../models/Consignment.js';
import ProductItem from '../models/ProductItem.js';

// @desc    Register a brand new incoming vessel consignment shipment
// @route   POST /api/consignments
export const registerConsignment = async (req, res) => {
  try {
    const { consignment_ref, type, total_landing_cost, notes, total_raw_weight } = req.body;

    const duplicate = await Consignment.findOne({ consignment_ref: consignment_ref.toUpperCase() });
    if (duplicate) {
      return res.status(400).json({ message: `Consignment reference '${consignment_ref}' already exists.` });
    }

    const consignment = await Consignment.create({
      consignment_ref,
      type,
      total_landing_cost,
      notes,
      'processing_run.total_raw_weight': type === 'giant_bale' ? total_raw_weight : 0
    });

    res.status(201).json(consignment);
  } catch (error) {
    res.status(500).json({ message: 'Error registering consignment structure', error: error.message });
  }
};

// @desc    Get all registered corporate consignments
// @route   GET /api/consignments
export const getConsignments = async (req, res) => {
  try {
    const shipments = await Consignment.find({}).sort({ arrival_date: -1 });
    res.status(200).json(shipments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consignment manifests', error: error.message });
  }
};

// @desc    Process a Giant Bale breakdown into standard bales and by-product weights
// @route   POST /api/consignments/:id/process
export const processGiantBale = async (req, res) => {
  try {
    const { id } = req.params;
    const { cleanBales, byproductKgs } = req.body; 
    // cleanBales sample structure: [{ itemCode: 'LMD', actual_size: 55, quantity_produced: 12, base_price: 150, adj_price: 150 }]

    const consignment = await Consignment.findById(id);
    if (!consignment) return res.status(404).json({ message: 'Consignment tracking profile not found.' });
    if (consignment.type !== 'giant_bale') return res.status(400).json({ message: 'Only Giant Bale allocations require sorting processing.' });

    let totalBalesCount = 0;

    // 1. Loop through each sorted cleanly packed wholesale type and update master variation entries
    for (const bale of cleanBales) {
      const product = await ProductItem.findOne({ itemCode: bale.itemCode.toUpperCase() });
      if (product) {
        product.stock_variations.push({
          production_ref: `${consignment.consignment_ref}-${bale.itemCode.toUpperCase()}`,
          consignment_id: consignment._id,
          actual_size: bale.actual_size,
          size_type: bale.actual_size === product.standardSize ? 'standard' : 'adjusted',
          quantity_produced: bale.quantity_produced,
          base_price: bale.base_price,
          adj_price: bale.adj_price
        });
        await product.save();
        totalBalesCount += bale.quantity_produced;
      }
    }

    // 2. Log by-product weight structures into database layers if present
    if (byproductKgs > 0) {
      // NOTE: Here we can trigger an injection into your byproduct model if needed
      consignment.processing_run.byproducts_kgs = byproductKgs;
    }

    // 3. Finalize consignment manifest state
    consignment.status = 'completed';
    consignment.processing_run.bales_produced = totalBalesCount;
    await consignment.save();

    res.status(200).json({ message: 'Giant bale breakdown processed, stock fields appended seamlessly.', consignment });
  } catch (error) {
    res.status(500).json({ message: 'Error breaking down giant bale allocation', error: error.message });
  }
};
