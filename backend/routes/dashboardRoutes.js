import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// Secure the route so only logged-in personnel can read cash flow variables
router.get('/summary', protectRoute, getDashboardSummary);

export default router;