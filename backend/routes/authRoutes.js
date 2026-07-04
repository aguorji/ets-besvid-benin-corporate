const express = require('express');
const router = express.Router();
const { loginUser, createStaffAccount } = require('../controllers/authController');
const { protectGate, restrictTo } = require('../middleware/authSecurity');

// Public route for authentication sessions
router.post('/login', loginUser);

// Secured administrative endpoint protecting staff generation
router.post('/create-staff', protectGate, restrictTo('admin'), createStaffAccount);

module.exports = router;