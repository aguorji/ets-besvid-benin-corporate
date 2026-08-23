// backend/controllers/productController.js
import ProductItem from '../models/ProductItem.js';
import Consignment from '../models/Consignment.js';

// @desc    Register a completely new root product type (e.g., LMD, MCSH)
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { itemCode, description, unit, standardSize } = req.body;

    if (!itemCode) {
      return res.status(400).json({ message: 'Item code is required.' });
    }

    const duplicateCheck = await ProductItem.findOne({ itemCode: itemCode.toUpperCase().trim() });
    if (duplicateCheck) {
      return res.status(400).json({ message: `Product item code '${itemCode.toUpperCase()}' already exists.` });
    }

    const newProduct = await ProductItem.create({
      itemCode: itemCode.toUpperCase().trim(),
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

// @desc    Fetch all available root products along with their embedded stock variations
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    // Dynamically flushes mismatched background indexes to accept empty arrays smoothly
    await ProductItem.cleanIndexes().catch(() => {});
    
    // Embedded stock_variations are fetched automatically by Mongoose
    const products = await ProductItem.find({}).sort({ itemCode: 1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving product registry', error: error.message });
  }
};

// @desc    Update an existing product's catalog details and propagate to active consignments
// @route   PUT /api/products/:productId
export const updateProductCatalogItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { itemCode, basePrice, description } = req.body;

    // 1. Prepare update payload
    const updateFields = {};
    if (itemCode) updateFields.itemCode = itemCode.toUpperCase().trim();
    if (basePrice !== undefined) updateFields.basePrice = Number(basePrice) || 0;
    if (description !== undefined) updateFields.description = description.trim();

    // 2. Update the global ProductItem catalog document
    const updatedProduct = await ProductItem.findByIdAndUpdate(
      productId,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product item catalog reference not found.' });
    }

    // 3. Propagate price/name changes to active consignments so terminals reflect updates instantly
    if (updateFields.basePrice !== undefined || updateFields.itemCode) {
      await Consignment.updateMany(
        { status: 'Active', "pricelist.item": { $regex: new RegExp(`^${updatedProduct.itemCode}$`, 'i') } },
        { $set: { "pricelist.$[elem].stdPrice": updatedProduct.basePrice } },
        { arrayFilters: [{ "elem.item": { $regex: new RegExp(`^${updatedProduct.itemCode}$`, 'i') } }] }
      );
    }

    res.status(200).json({ 
      message: 'Product catalog and active consignments updated successfully across all terminals.', 
      updatedProduct 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating pricelist matrix', error: error.message });
  }
};

// @desc    Add a brand new stock batch/variation to a specific product
// @route   POST /api/products/:id/variations
export const addStockVariation = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      production_ref, 
      consignment_id, 
      actual_size, 
      size_type, 
      quantity_produced, 
      base_price, 
      adj_price 
    } = req.body;

    const product = await ProductItem.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Target product not found' });
    }

    // Push new batch into the embedded stock_variations array
    product.stock_variations.push({
      production_ref,
      consignment_id,
      actual_size,
      size_type,
      quantity_produced,
      quantity_balance: quantity_produced, // Ensure balance initializes to produced quantity
      base_price,
      adj_price
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error logging stock variation', error: error.message });
  }
};