import express from 'express';
import { logExpense, getExpenseLedger } from '../controllers/expenseController.js';
import { protectGate } from '../middleware/authSecurity.js';

const router = express.Router();

router.route('/')
  .post(protectGate, logExpense)
  .get(protectGate, getExpenseLedger);

export default router;
