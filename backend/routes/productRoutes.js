import express from 'express';
import { 
  createProduct, 
  getProducts, 
  addStockVariation, 
  updateProductCatalogItem 
} from '../controllers/productController.js';
import { protectRoute, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Same gap as consignmentRoutes.js had — no auth was ever applied here.
router.use(protectRoute);

// Base Product pathways mapping cleanly to your Master Items view
router.route('/')
  .get(getProducts)
  .post(adminOnly, createProduct);

// Nested route to append new container production batches (e.g. Batch 1, Batch 2)
router.route('/:id/variations')
  .post(addStockVariation);

// Exposes the route to update prices and correct item names
router.route('/:productId')
  .put(adminOnly, updateProductCatalogItem);

export default router;