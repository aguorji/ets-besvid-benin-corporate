import express from 'express';
import { loginUser, createStaffAccount } from '../controllers/authController.js';
import { protectGate, restrictTo } from '../middleware/authSecurity.js';

const router = express.Router();

// Public route for authentication sessions
router.post('/login', loginUser);

// Secured administrative endpoint protecting staff generation
router.post('/create-staff', protectGate, restrictTo('admin'), createStaffAccount);

export default router;
