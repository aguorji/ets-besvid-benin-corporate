import express from 'express';
import { logByproductSale, getByproductLedger } from '../controllers/byproductController.js';
import { protectGate } from '../middleware/authSecurity.js';

const router = express.Router();

router.route('/')
  .post(protectGate, logByproductSale)
  .get(protectGate, getByproductLedger);

export default router;
