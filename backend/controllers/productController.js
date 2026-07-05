import ProductItem from '../models/ProductItem.js';

// @desc     Create a New Core Product Catalog Item (e.g., Grade A Shirts, Mixed Rags)
// @route    POST /api/products
// @access   Private
export const createProductItem = async (req, res) => {
  const { name, initials, unit, standard_size } = req.body;

  try {
    const itemExists = await ProductItem.findOne({ initials: initials.toUpperCase() });
    if (itemExists) {
      return res.status(400).json({ error: `A product line with initials [${initials.toUpperCase()}] already exists.` });
    }

    const product = await ProductItem.create({
      name,
      initials: initials.toUpperCase(),
      unit: unit || 'KGS',
      standard_size,
      stock_variations: []
    });

    res.status(201).json({ message: "Product line cataloged successfully.", product });
  } catch (error) {
    res.status(500).json({ error: "Failed to create core product line definition." });
  }
};

// @desc     Log a Production Run / Split-Bale Entry (Creates or updates a stock variation)
// @route    POST /api/products/:id/production
// @access   Private
export const logProductionRun = async (req, res) => {
  const { production_ref, consignment_id, actual_size, quantity_produced, base_price } = req.body;
  const productId = req.params.id;

  try {
    const product = await ProductItem.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Core product category record not found." });
    }

    // Check if the unique production reference run identifier already exists anywhere in the system
    const refCheck = await ProductItem.findOne({ "stock_variations.production_ref": production_ref });
    if (refCheck) {
      return res.status(400).json({ error: `Production reference run [${production_ref}] has already been processed.` });
    }

    // CORE MATHEMATICAL LOGIC GATE: Calculate dynamic size scaling variance adjustments
    // Formula: adjusted_price = base_price * (actual_size / standard_size)
    const sizeRatio = actual_size / product.standard_size;
    const adj_price = Math.round(base_price * sizeRatio); // Dynamic alignment across currencies

    const size_type = actual_size === product.standard_size ? 'standard' : 'adjusted';

    // Push the newly verified variation item directly into the MongoDB document sub-array
    product.stock_variations.push({
      production_ref,
      consignment_id,
      actual_size,
      size_type,
      quantity_produced,
      quantity_sold: 0,
      base_price,
      adj_price
    });

    // Triggers the Mongoose .pre('save') hook to compute balances and stock financial values
    await product.save();

    res.status(201).json({
      message: "Production run logged. Inventory matrix updated with dynamic weight adjustments.",
      product
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to execute production run log sequence." });
  }
};

// @desc     Fetch Complete Inventory Ledger Matrix
// @route    GET /api/products
// @access   Private
export const getInventoryLedger = async (req, res) => {
  try {
    const inventory = await ProductItem.find()
      .populate('stock_variations.consignment_id', 'consignment_ref arrival_date');
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ error: "Failed to read core inventory master ledger." });
  }
};
