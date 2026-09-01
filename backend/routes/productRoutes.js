import express from 'express';
import { 
  createProduct, 
  getProducts, 
  addStockVariation, 
  updateProductCatalogItem 
} from '../controllers/productController.js';

const router = express.Router();

// Base Product pathways mapping cleanly to your Master Items view
router.route('/')
  .get(getProducts)
  .post(createProduct);

// Nested route to append new container production batches (e.g. Batch 1, Batch 2)
router.route('/:id/variations')
  .post(addStockVariation);

// Exposes the route to update prices and correct item names
router.route('/:productId')
  .put(updateProductCatalogItem);

export default router;