import express from 'express';
import { createConsignment, getAllConsignments } from '../controllers/consignmentController.js';
import { protectGate } from '../middleware/authSecurity.js';

const router = express.Router();

// Both creation and viewing require the user to be logged in
router.route('/')
  .post(protectGate, createConsignment)
  .get(protectGate, getAllConsignments);

export default router;
