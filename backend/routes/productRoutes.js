const express = require('express');
const router = express.Router();
const { createProductItem, logProductionRun, getInventoryLedger } = require('../controllers/productController');
const { protectGate } = require('../middleware/authSecurity');

// Inventory reading and product cataloging paths
router.route('/')
  .post(protectGate, createProductItem)
  .get(protectGate, getInventoryLedger);

// Sub-route designated for logging specific production run variations
router.post('/:id/production', protectGate, logProductionRun);

module.exports = router;