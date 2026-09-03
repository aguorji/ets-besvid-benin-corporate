import express from 'express';
import { logByproductSale, getByproductLedger } from '../controllers/byproductController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protectRoute, logByproductSale)
  .get(protectRoute, getByproductLedger);

export default router;