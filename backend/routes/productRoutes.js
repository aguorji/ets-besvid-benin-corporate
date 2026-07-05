import express from 'express';
import { createProductItem, logProductionRun, getInventoryLedger } from '../controllers/productController.js';
import { protectGate } from '../middleware/authSecurity.js';

const router = express.Router();

// Inventory reading and product cataloging paths
router.route('/')
  .post(protectGate, createProductItem)
  .get(protectGate, getInventoryLedger);

// Sub-route designated for logging specific production run variations
router.post('/:id/production', protectGate, logProductionRun);

export default router;
