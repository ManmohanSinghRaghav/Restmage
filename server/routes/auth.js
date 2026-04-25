const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  register, login, getMe, updateProfile, changePassword
} = require('../controllers/authController');

const router = express.Router();

const USERNAME_MIN = 3, USERNAME_MAX = 30, PASSWORD_MIN = 6;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

router.post('/register', [
  body('username').isLength({ min: USERNAME_MIN, max: USERNAME_MAX }).matches(USERNAME_PATTERN)
    .withMessage('Username must be 3-30 chars, letters/numbers/underscores only'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: PASSWORD_MIN }).withMessage(`Password must be at least ${PASSWORD_MIN} chars`)
], register);

router.post('/login', [
<<<<<<< HEAD
  body('email').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

router.get('/me', auth, getMe);
=======
  body('email').trim().notEmpty().withMessage('Email or username is required'),
  body('password').trim().notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    if (!validateRequest(req, res)) return;

    const { email: identifier, password } = req.body;

    // Determine whether the identifier looks like an email or a username
    const isEmail = typeof identifier === 'string' && identifier.includes('@');
    // If an email is provided, compare using lowercase; usernames are used as-is
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
>>>>>>> 93af25bc042d533010d982d8d0fd4e6fa273aca1

router.put('/profile', auth, [
  body('username').optional().isLength({ min: USERNAME_MIN, max: USERNAME_MAX }).matches(USERNAME_PATTERN),
  body('email').optional().isEmail().normalizeEmail()
], updateProfile);

router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: PASSWORD_MIN }).withMessage(`New password must be at least ${PASSWORD_MIN} chars`)
], changePassword);

module.exports = router;