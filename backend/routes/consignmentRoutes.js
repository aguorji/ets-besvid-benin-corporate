const express = require('express');
const router = express.Router();
const { createConsignment, getAllConsignments } = require('../controllers/consignmentController');
const { protectGate } = require('../middleware/authSecurity');

// Both creation and viewing require the user to be logged in
router.route('/')
  .post(protectGate, createConsignment)
  .get(protectGate, getAllConsignments);

module.exports = router;