import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { protectGate } from '../middleware/authSecurity.js';

const router = express.Router();

// Secure the route so only logged-in personnel can read cash flow variables
router.get('/summary', protectGate, getDashboardSummary);

export default router;
