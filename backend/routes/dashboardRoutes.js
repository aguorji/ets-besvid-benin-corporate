const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { protectGate } = require('../middleware/authSecurity');

// Secure the route so only logged-in personnel can read cash flow variables
router.get('/summary', protectGate, getDashboardSummary);

module.exports = router;