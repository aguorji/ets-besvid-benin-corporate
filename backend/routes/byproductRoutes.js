const express = require('express');
const router = express.Router();
const { logByproductSale, getByproductLedger } = require('../controllers/byproductController');
const { protectGate } = require('../middleware/authSecurity');

router.route('/')
  .post(protectGate, logByproductSale)
  .get(protectGate, getByproductLedger);

module.exports = router;