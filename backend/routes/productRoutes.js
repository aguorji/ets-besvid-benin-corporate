import express from 'express';
import { createProduct, getProducts, addStockVariation } from '../controllers/productController.js';

const router = express.Router();

// Base Product pathways mapping cleanly to your Master Items view
router.route('/')
  .post(createProduct)
  .get(getProducts);

// Nested route to append new container production batches (e.g. Batch 1, Batch 2)
router.route('/:id/variations')
  .post(addStockVariation);

export default router;
