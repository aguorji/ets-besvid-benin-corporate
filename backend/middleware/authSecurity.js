const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Gatekeeper Middleware: Verifies the user is logged in with a valid token signature
exports.protectGate = async (req, res, next) => {
  let token;

  // Check if token arrives securely via the Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Decrypt and decode the token session
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user from MongoDB and attach it to the active request context (minus password)
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user || !req.user.is_active) {
        return res.status(401).json({ error: "Access Denied: Revoked account profile configuration." });
      }

      return next(); // Pass verification check successfully
    } catch (error) {
      return res.status(401).json({ error: "Access Denied: Expired or altered security token signature." });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Access Denied: Explicit security token signature missing." });
  }
};

// 2. Role Enforcement Middleware: Rejects standard users before they touch Admin-only models
exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // allowedRoles will accept strings like: 'admin'
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Unauthorized Access: Administrative clearance tier required. Your current role is '${req.user.role}'.` 
      });
    }
    next();
  };
};