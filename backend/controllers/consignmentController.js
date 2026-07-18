// backend/controllers/consignmentController.js
import mongoose from 'mongoose'; // 👈 IMPORT MONGOOSE FOR TRANSACTIONS
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

// @desc    Process a Giant Bale breakdown into standard/adjusted bales and by-product weights
// @route   POST /api/consignments/:id/process
export const processGiantBale = async (req, res) => {
  // START TRANSACTION SESSION
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { sortedItems, byproductsSacked } = req.body; 

    // Pass the session to the query
    const consignment = await Consignment.findById(id).session(session);
    if (!consignment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Consignment tracking profile not found.' });
    }
    if (consignment.type !== 'giant_bale') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Only Giant Bale allocations require sorting processing.' });
    }

    consignment.processing_run.sorted_items = sortedItems.map(item => ({
      product_ref: item.product_ref.toUpperCase(),
      target_weight_g_bale: Number(item.target_weight_g_bale),
      actual_weight_g_bale: Number(item.actual_weight_g_bale),
      bales_produced: Number(item.bales_produced)
    }));

    if (byproductsSacked && byproductsSacked.length > 0) {
      consignment.processing_run.byproducts_sacked = byproductsSacked.map(by => ({
        byproduct_type: by.byproduct_type.toUpperCase(),
        weight_kg: Number(by.weight_kg),
        price_per_kg: Number(by.price_per_kg)
      }));
    }

    for (const item of sortedItems) {
      // Pass the session to the query
      const product = await ProductItem.findOne({ itemCode: item.product_ref.toUpperCase() }).session(session);
      if (product) {
        const basePrice = product.basePrice || 0; 
        const targetWeight = Number(item.target_weight_g_bale);
        const actualWeight = Number(item.actual_weight_g_bale);
        
        const calculatedAdjPrice = (actualWeight === targetWeight || targetWeight === 0) 
          ? basePrice 
          : Math.round((basePrice / targetWeight) * actualWeight);

        product.stock_variations.push({
          production_ref: `${consignment.consignment_ref}-${item.product_ref.toUpperCase()}-${actualWeight}KG`,
          consignment_id: consignment._id,
          actual_size: actualWeight,
          size_type: actualWeight === targetWeight ? 'standard' : 'adjusted',
          quantity_produced: Number(item.bales_produced),
          base_price: basePrice,
          adj_price: calculatedAdjPrice
        });
        
        // Pass the session to the save action
        await product.save({ session });
      }
    }

    consignment.status = 'completed';
    // Pass the session to the save action
    await consignment.save({ session });

    // COMMIT ALL TRANSACTIONS SIMULTANEOUSLY
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      message: 'Giant bale breakdown processed and dynamic inventory variations generated seamlessly.', 
      consignment 
    });
  } catch (error) {
    // IF ANYTHING FAILS, ROLLBACK ALL CHANGES
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Error breaking down giant bale allocation', error: error.message });
  }
};

// @desc    Admin correction to adjust an already completed giant bale sorting run and recalculate inventory variations
// @route   PUT /api/consignments/:id/process
export const updateProcessedGiantBale = async (req, res) => {
  // START TRANSACTION SESSION
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { sortedItems, byproductsSacked } = req.body;

    // Pass the session to the query
    const consignment = await Consignment.findById(id).session(session);
    if (!consignment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Consignment tracking profile not found.' });
    }
    if (consignment.type !== 'giant_bale') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Only Giant Bale allocations have sorting logs.' });
    }

    // --- STEP A: REVERSE INVENTORY FROM PREVIOUS RUN ---
    for (const oldItem of consignment.processing_run.sorted_items) {
      const product = await ProductItem.findOne({ itemCode: oldItem.product_ref }).session(session);
      if (product) {
        product.stock_variations = product.stock_variations.filter(
          v => v.consignment_id.toString() !== consignment._id.toString()
        );
        await product.save({ session });
      }
    }

    // --- STEP B: OVERWRITE WITH NEW LOG DATA ---
    consignment.processing_run.sorted_items = sortedItems.map(item => ({
      product_ref: item.product_ref.toUpperCase(),
      target_weight_g_bale: Number(item.target_weight_g_bale),
      actual_weight_g_bale: Number(item.actual_weight_g_bale),
      bales_produced: Number(item.bales_produced)
    }));

    if (byproductsSacked && byproductsSacked.length > 0) {
      consignment.processing_run.byproducts_sacked = byproductsSacked.map(by => ({
        byproduct_type: by.byproduct_type.toUpperCase(),
        weight_kg: Number(by.weight_kg),
        price_per_kg: Number(by.price_per_kg)
      }));
    } else {
      consignment.processing_run.byproducts_sacked = [];
    }

    // --- STEP C: CALCULATE NEW VARIATIONS AND APPLY STOCK ---
    for (const item of sortedItems) {
      const product = await ProductItem.findOne({ itemCode: item.product_ref.toUpperCase() }).session(session);
      if (product) {
        const basePrice = product.basePrice || 0;
        const targetWeight = Number(item.target_weight_g_bale);
        const actualWeight = Number(item.actual_weight_g_bale);
        
        const calculatedAdjPrice = (actualWeight === targetWeight || targetWeight === 0) 
          ? basePrice 
          : Math.round((basePrice / targetWeight) * actualWeight);

        product.stock_variations.push({
          production_ref: `${consignment.consignment_ref}-${item.product_ref.toUpperCase()}-${actualWeight}KG`,
          consignment_id: consignment._id,
          actual_size: actualWeight,
          size_type: actualWeight === targetWeight ? 'standard' : 'adjusted',
          quantity_produced: Number(item.bales_produced),
          base_price: basePrice,
          adj_price: calculatedAdjPrice
        });
        
        await product.save({ session });
      }
    }

    await consignment.save({ session });

    // COMMIT ALL TRANSACTIONS SIMULTANEOUSLY
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      message: 'Admin correction applied successfully! Inventory stock variations have been cleanly recalculated.', 
      consignment 
    });
  } catch (error) {
    // IF ANYTHING FAILS, ROLLBACK ALL CHANGES COMPLETELY
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Error applying admin correction to sorting run', error: error.message });
  }
};