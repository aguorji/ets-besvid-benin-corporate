const express = require('express');
const router = express.Router();
const { recordSaleTransaction, getAccountsReceivable } = require('../controllers/saleController');
const { protectGate } = require('../middleware/authSecurity');

// Standard transaction route configuration
router.route('/')
  .post(protectGate, recordSaleTransaction);

// Dedicated endpoint to monitor accounts receivable and customer debt performance metrics
router.route('/receivables')
  .get(protectGate, getAccountsReceivable);

module.exports = router;