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
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: cleanEmail });

    if (user && (await user.matchPassword(password))) {
      if (!user.is_active) {
        return res.status(401).json({ error: "Access Denied: Account profile is deactivated." });
      }

      return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      return res.status(401).json({ error: "Invalid email or password credentials." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Authentication system failure." });
  }
};

 // @desc    Admin Only: Create New Staff Accounts
// @route   POST /api/auth/create-staff
// @access  Private/Admin
export const createStaffAccount = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const cleanEmail = email ? email.toLowerCase().trim() : '';

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ error: "A user profile with this email already exists." });
    }

    // User Schema pre('save') hook handles password hashing automatically
    const newStaff = await User.create({
      name,
      email: cleanEmail,
      password,
      role: role || 'user'
    });

    return res.status(201).json({
      _id: newStaff._id,
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      message: "Staff member identity registered successfully."
    });

  } catch (error) {
    // 🔍 This will print the exact failure reason in your backend terminal
    console.error("🚨 Create Staff Error Stack:", error);
    return res.status(500).json({ error: "Failed to initialize staff profile.", details: error.message });
  }
};