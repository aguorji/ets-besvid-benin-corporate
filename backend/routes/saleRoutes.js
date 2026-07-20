// backend/routes/saleRoutes.js
import express from 'express';
import { 
  recordSaleTransaction, 
  getAccountsReceivable,
  getAllSalesTransactions // 👈 Add this import
} from '../controllers/saleController.js';
import { protectGate } from '../middleware/authSecurity.js';

const router = express.Router();

// Standard transaction route configuration
router.route('/')
  .post(protectGate, recordSaleTransaction)
  .get(protectGate, getAllSalesTransactions); // 👈 Add this line to stream logs to the dashboard

// Dedicated endpoint to monitor accounts receivable and customer debt performance metrics
router.route('/receivables')
  .get(protectGate, getAccountsReceivable);

export default router;