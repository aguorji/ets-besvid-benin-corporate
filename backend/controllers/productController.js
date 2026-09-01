// backend/controllers/productController.js
import ProductItem from '../models/ProductItem.js';
import Consignment from '../models/Consignment.js';

// @desc    Register a completely new root product type
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { itemCode, description, unit, standardSize, basePrice } = req.body;

    if (!itemCode) {
      return res.status(400).json({ message: 'Item code is required.' });
    }

    const cleanCode = itemCode.toUpperCase().trim();
    const duplicateCheck = await ProductItem.findOne({ itemCode: cleanCode });
    if (duplicateCheck) {
      return res.status(400).json({ message: `Product item code '${cleanCode}' already exists.` });
    }

    const newProduct = await ProductItem.create({
      itemCode: cleanCode,
      description: description || 'Registered Root Product',
      unit: unit || 'PCS',
      standardSize: Number(standardSize) || 0,
      basePrice: Number(basePrice) || 0,
      stock_variations: []
    });

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error establishing root product', error: error.message });
  }
};

// @desc    Fetch all root products from the Master Catalog. Stock from
//          consignments is already kept in sync here by
//          syncProductionToProducts() in consignmentRoutes.js on every
//          POST / and PUT /:id/production — so this no longer needs to
//          re-derive anything from Consignment documents at read time.
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    await ProductItem.cleanIndexes().catch(() => {});

    const products = await ProductItem.find({}).lean();

    const withLiveBalance = products.map(p => {
      const variations = p.stock_variations || [];
      const liveStockQty = variations.reduce(
        (sum, v) => sum + (v.quantity_balance ?? v.quantity_produced ?? 0),
        0
      );
      return { ...p, liveStockQty };
    });

    withLiveBalance.sort((a, b) => a.itemCode.localeCompare(b.itemCode));
    res.status(200).json(withLiveBalance);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving product registry', error: error.message });
  }
};

// @desc    Update an existing product's catalog details
// @route   PUT /api/products/:productId
export const updateProductCatalogItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { itemCode, basePrice, description } = req.body;

    const updateFields = {};
    if (itemCode) updateFields.itemCode = itemCode.toUpperCase().trim();
    if (basePrice !== undefined) updateFields.basePrice = Number(basePrice) || 0;
    if (description !== undefined) updateFields.description = description.trim();

    const updatedProduct = await ProductItem.findByIdAndUpdate(
      productId,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product item catalog reference not found.' });
    }

    res.status(200).json({ 
      message: 'Product catalog updated successfully.', 
      updatedProduct 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product matrix', error: error.message });
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

    product.stock_variations.push({
      production_ref,
      consignment_id,
      actual_size,
      size_type,
      quantity_produced,
      quantity_balance: quantity_produced,
      base_price,
      adj_price
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error logging stock variation', error: error.message });
  }
};