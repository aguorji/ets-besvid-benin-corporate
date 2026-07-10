import ProductItem from '../models/ProductItem.js';

// @desc    Register a completely new root product type (e.g., LMD, MCSH)
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { itemCode, description, unit, standardSize } = req.body;

    const duplicateCheck = await ProductItem.findOne({ itemCode: itemCode.toUpperCase() });
    if (duplicateCheck) {
      return res.status(400).json({ message: `Product item code '${itemCode.toUpperCase()}' already exists.` });
    }

    const newProduct = await ProductItem.create({
      itemCode,
      description,
      unit,
      standardSize,
      stock_variations: []
    });

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error establishing root product', error: error.message });
  }
};

// @desc    Fetch all available root products for selection drops
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    // Dynamically flushes mismatched background indexes to accept empty arrays smoothly
    await ProductItem.cleanIndexes().catch(() => {});
    
    const products = await ProductItem.find({}).sort({ itemCode: 1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving product registry', error: error.message });
  }
};

// @desc    Add a brand new stock batch/variation to a specific product
// @route   POST /api/products/:id/variations
export const addStockVariation = async (req, res) => {
  try {
    const { id } = req.params;
    const { production_ref, consignment_id, actual_size, size_type, quantity_produced, base_price, adj_price } = req.body;

    const product = await ProductItem.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Target product not found' });
    }

    product.stock_variations.push({
      production_ref,
      consignment_id,
      actual_size,
      size_type,
      quantity_produced,
      base_price,
      adj_price
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error logging stock variation', error: error.message });
  }
};
