import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectRoute = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user details from DB excluding password
      const user = await User.findById(decodedPayload.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: "Not authorized: User account not found." });
      }

      if (!user.is_active) {
        return res.status(401).json({ message: "Not authorized: Account is deactivated." });
      }

      // Attach complete user object (id, email, role) to req.user
      req.user = user;
      return next();
    } catch (error) {
      console.error("Token verification security failure:", error);
      return res.status(401).json({ message: "Not authorized: Token encryption invalid or expired." });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized: No security bearer token discovered in headers." });
  }
};

// Guard middleware to restrict sensitive routes (landing costs, net profits) strictly to Admin
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Admin privileges required." });
};