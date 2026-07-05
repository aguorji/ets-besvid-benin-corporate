import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Helper function to sign JWT tokens
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '12h' });
};

// @desc     Secure Log-In Session
// @route    POST /api/auth/login
// @access   Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.is_active) {
        return res.status(401).json({ error: "Access Denied: Account profile is deactivated." });
      }

      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ error: "Invalid email or password credentials." });
    }
  } catch (error) {
    res.status(500).json({ error: "Authentication system failure." });
  }
};

// @desc     Admin Only: Create New Staff Accounts
// @route    POST /api/auth/create-staff
// @access   Private/Admin
export const createStaffAccount = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "A user profile with this email already exists." });
    }

  } catch (error) {
    res.status(500).json({ error: "Failed to initialize staff profile." });
  }
};
