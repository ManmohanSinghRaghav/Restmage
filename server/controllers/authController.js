const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '7d';

const generateToken = (userId, email) =>
  jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

const sendValidationError = (res, errors) => {
  res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
};

// POST /api/auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors);

  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const user = await new User({ username, email, password }).save();
    const token = generateToken(user._id, user.email);

    res.status(201).json({ message: 'User registered successfully', token, user: user.toJSON() });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    console.error('register:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors);

  try {
    const { email: identifier, password } = req.body;
    const isEmail = typeof identifier === 'string' && identifier.includes('@');
    const query = isEmail ? { email: identifier.toLowerCase() } : { username: identifier };

    const user = await User.findOne(query);
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.email);
    res.json({ message: 'Login successful', token, user: user.toJSON() });
  } catch (err) {
    console.error('login:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors);

  try {
    const { username, email } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;

    if (username || email) {
      const conflict = await User.findOne({
        $and: [{ _id: { $ne: req.user._id } }, { $or: [{ email }, { username }] }]
      });
      if (conflict) return res.status(400).json({ message: 'Username or email already exists' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ message: 'Profile updated successfully', user: user.toJSON() });
  } catch (err) {
    console.error('updateProfile:', err.message);
    res.status(500).json({ message: 'Server error during profile update' });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors);

  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('changePassword:', err.message);
    res.status(500).json({ message: 'Server error during password change' });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
