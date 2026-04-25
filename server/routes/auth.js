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
  body('email').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

router.get('/me', auth, getMe);

router.put('/profile', auth, [
  body('username').optional().isLength({ min: USERNAME_MIN, max: USERNAME_MAX }).matches(USERNAME_PATTERN),
  body('email').optional().isEmail().normalizeEmail()
], updateProfile);

router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: PASSWORD_MIN }).withMessage(`New password must be at least ${PASSWORD_MIN} chars`)
], changePassword);

module.exports = router;