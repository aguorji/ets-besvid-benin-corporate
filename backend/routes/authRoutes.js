import express from 'express';
import rateLimit from 'express-rate-limit';
import { loginUser, createStaffAccount } from '../controllers/authController.js';
import { protectRoute, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Confirmed necessary by direct testing — 10+ repeated wrong-password
// attempts produced zero slowdown and zero lockout. Without this, login
// accepts unlimited rapid-fire password guesses at whatever speed a script
// can send them.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 6,                   // 6 attempts per IP per window
  message: { error: "Too many login attempts. Please wait 15 minutes and try again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public route for login sessions
router.post('/login', loginLimiter, loginUser);

// Secured administrative route for staff account creation
router.post('/create-staff', protectRoute, adminOnly, createStaffAccount);

export default router;