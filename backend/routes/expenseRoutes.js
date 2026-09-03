import express from 'express';
import { logExpense, getExpenseLedger } from '../controllers/expenseController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protectRoute, logExpense)
  .get(protectRoute, getExpenseLedger);

export default router;
