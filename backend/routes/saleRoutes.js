import express from 'express';
import { 
  recordSaleTransaction, 
  getAllSalesTransactions, 
  getAccountsReceivable 
} from '../controllers/saleController.js';
import { protectRoute } from '../middleware/authMiddleware.js'; // The structural guard

const router = express.Router();

// Apply protection so unauthorized actors cannot access or manipulate operations
router.route('/')
  .post(protectRoute, recordSaleTransaction)
  .get(protectRoute, getAllSalesTransactions);

router.route('/receivables')
  .get(protectRoute, getAccountsReceivable);

export default router;