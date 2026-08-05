import User from '../models/User.js';

// @desc    Get all registered users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Toggle account active status (is_active)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res) => {
  const { is_active } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Prevent Admin from deactivating their own account accidentally
    if (user._id.toString() === req.user._id.toString() && !is_active) {
      return res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
    }

    user.is_active = is_active;
    await user.save();

    return res.json({
      message: `User account ${user.is_active ? 'activated' : 'deactivated'} successfully.`,
      _id: user._id,
      is_active: user.is_active
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Reset user password (Admin override)
// @route   PATCH /api/users/:id/password
// @access  Private/Admin
export const resetUserPassword = async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Assigning password triggers the UserSchema.pre('save') hook to hash it via bcryptjs
    user.password = password;
    await user.save();

    return res.json({
      message: `Password for ${user.name} has been updated successfully.`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};