import express from 'express';
import { recordDebtPayment, getDebtPaymentHistory } from '../controllers/debtController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/pay', protectRoute, recordDebtPayment);
router.get('/history', protectRoute, getDebtPaymentHistory);

export default router;