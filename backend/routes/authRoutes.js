import express from 'express';
import { loginUser, createStaffAccount } from '../controllers/authController.js';
import { protectRoute, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for login sessions
router.post('/login', loginUser);

// Secured administrative route for staff account creation
router.post('/create-staff', protectRoute, adminOnly, createStaffAccount);

export default router;