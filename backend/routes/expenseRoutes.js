const express = require('express');
const router = express.Router();
const { logExpense, getExpenseLedger } = require('../controllers/expenseController');
const { protectGate } = require('../middleware/authSecurity');

router.route('/')
  .post(protectGate, logExpense)
  .get(protectGate, getExpenseLedger);

module.exports = router;