// backend/controllers/consignmentController.js
import mongoose from 'mongoose'; // 👈 IMPORT MONGOOSE FOR TRANSACTIONS
import Consignment from '../models/Consignment.js';
import ProductItem from '../models/ProductItem.js';

// @desc    Register a brand new incoming vessel consignment shipment
// @route   POST /api/consignments
export const registerConsignment = async (req, res) => {
  try {
    const { consignment_ref, type, total_landing_cost, notes, total_raw_weight, pricelist } = req.body;

    const duplicate = await Consignment.findOne({ consignment_ref: consignment_ref.toUpperCase() });
    if (duplicate) {
      return res.status(400).json({ message: `Consignment reference '${consignment_ref}' already exists.` });
    }

    const assignedType = type || 'Giant Bales';
    const parsedLandingCost = Number(total_landing_cost) || 0;

    const consignment = await Consignment.create({
      consignment_ref: consignment_ref.trim(),
      type: assignedType,
      total_landing_cost: parsedLandingCost, // 👈 Saved at root level for easy UI access
      pricelist: pricelist || [],
      cost_pool: {
        base_purchase_cost: parsedLandingCost
      },
      'processing_run.total_raw_weight': (assignedType.toLowerCase().includes('giant')) ? Number(total_raw_weight) || 0 : 0
    });

    // --- AUTO-SYNC CONSIGNMENT PRICELIST ITEMS TO GLOBAL PRODUCT CATALOG ---
    if (pricelist && Array.isArray(pricelist) && pricelist.length > 0) {
      for (const entry of pricelist) {
        const code = entry.item || entry.itemCode;
        if (code) {
          await ProductItem.findOneAndUpdate(
            { itemCode: code.toUpperCase().trim() },
            { 
              $setOnInsert: { 
                itemCode: code.toUpperCase().trim(),
                description: entry.description || 'Imported via Consignment Packing List',
                unit: entry.unit || 'KGS',
                standardSize: Number(entry.stdSize || entry.standardSize) || 0,
                basePrice: Number(entry.stdPrice || entry.basePrice) || 0,
                stock_variations: []
              }
            },
            { upsert: true, new: true }
          );
        }
      }
    }

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

// @desc    Get consignment reconciliation metrics and yields
// @route   GET /api/consignments/:id/reconciliation
export const getConsignmentReconciliation = async (req, res) => {
  try {
    const { id } = req.params;
    const consignment = await Consignment.findById(id);

    if (!consignment) {
      return res.status(404).json({ message: 'Consignment registry record not found.' });
    }

    res.status(200).json({
      _id: consignment._id,
      consignment_ref: consignment.consignment_ref,
      type: consignment.type,
      total_landing_cost: consignment.total_landing_cost,
      status: consignment.status,
      processing_run: consignment.processing_run || null,
      arrival_date: consignment.arrival_date
    });
  } catch (error) {
    res.status(500).json({ message: 'Reconciliation data compilation failure', error: error.message });
  }
};

// @desc    Sync all existing consignment pricelist items into the global ProductItem master collection
// @route   POST /api/consignments/sync-catalog
export const syncConsignmentProductsToMaster = async (req, res) => {
  try {
    const consignments = await Consignment.find({});
    let addedCount = 0;

    for (const con of consignments) {
      if (con.pricelist && Array.isArray(con.pricelist)) {
        for (const item of con.pricelist) {
          const code = item.item || item.itemCode;
          if (code) {
            const cleanCode = code.toUpperCase().trim();
            const exists = await ProductItem.findOne({ itemCode: cleanCode });
            if (!exists) {
              await ProductItem.create({
                itemCode: cleanCode,
                description: item.description || 'Extracted from Consignment',
                unit: item.unit || 'KGS',
                standardSize: Number(item.stdSize || item.standardSize) || 0,
                basePrice: Number(item.stdPrice || item.basePrice) || 0,
                stock_variations: []
              });
              addedCount++;
            }
          }
        }
      }
    }

    res.status(200).json({ message: `Successfully synced ${addedCount} items from existing consignments into the product catalog.` });
  } catch (error) {
    res.status(500).json({ message: 'Error syncing catalog items', error: error.message });
  }
};


// --- TEMPORARY DEBUG ROUTE ---
export const debugConsignment = async (req, res) => {
  try {
    const item = await Consignment.findOne({ consignment_ref: "AA-22-26" }).lean();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};