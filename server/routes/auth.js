const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '7d';

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 6;

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

const validateRequest = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    // Return a friendly top-level message so the client UI can surface it
    res.status(400).json({ message: first.msg, errors: errors.array() });
    return false;
  }
  return true;
};

const generateAuthToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

const usernameValidation = body('username')
  .isLength({ min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH })
  .withMessage(`Username must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters`)
  .matches(USERNAME_PATTERN)
  .withMessage('Username can only contain letters, numbers, and underscores');

const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please enter a valid email');

const passwordValidation = body('password')
  .isLength({ min: PASSWORD_MIN_LENGTH })
  .withMessage(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);

router.post('/register', [
  usernameValidation,
  emailValidation,
  passwordValidation
], async (req, res) => {
  try {
    if (!validateRequest(req, res)) return;

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = generateAuthToken(user._id, user.email);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error?.code === 11000) {
      // Duplicate key error from unique index
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    if (error?.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0];
      return res.status(400).json({ message: firstError?.message || 'Invalid input' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login now supports either email or username in the same field for better UX.
// The client currently sends this value under the "email" key.
router.post('/login', [
  body('email').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    if (!validateRequest(req, res)) return;

    const { email: identifier, password } = req.body;

    // Determine whether the identifier looks like an email or a username
    const isEmail = typeof identifier === 'string' && identifier.includes('@');
    const query = isEmail
      ? { email: identifier.toLowerCase() }
      : { username: identifier };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateAuthToken(user._id, user.email);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', auth, [
  body('username').optional().custom((value) => {
    if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) {
      throw new Error(`Username must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters`);
    }
    if (!USERNAME_PATTERN.test(value)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }
    return true;
  }),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    if (!validateRequest(req, res)) return;

    const { username, email } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (email) updates.email = email;

    if (username || email) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: req.user._id } },
          { $or: [{ email }, { username }] }
        ]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'Username or email already exists' 
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage(`New password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
], async (req, res) => {
  try {
    if (!validateRequest(req, res)) return;

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

module.exports = router;