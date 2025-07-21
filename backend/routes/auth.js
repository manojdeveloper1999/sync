const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const SyncLog = require('../models/SyncLog');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email or username'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Log registration
    await SyncLog.createLog({
      operation: 'create',
      entityType: 'user',
      entityId: user._id,
      message: `New user registered: ${username}`,
      level: 'info',
      source: 'web',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', [
  body('username').trim().escape(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      await SyncLog.createLog({
        operation: 'error',
        entityType: 'auth',
        message: `Failed login attempt for username: ${username}`,
        level: 'warning',
        source: 'web',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await SyncLog.createLog({
        operation: 'error',
        entityType: 'auth',
        entityId: user._id,
        message: `Failed login attempt - wrong password for user: ${username}`,
        level: 'warning',
        source: 'web',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await SyncLog.createLog({
      operation: 'info',
      entityType: 'auth',
      entityId: user._id,
      message: `User logged in: ${username}`,
      level: 'info',
      source: 'web',
      userId: user._id,
      username: user.username,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout (client-side token removal, but log the action)
router.post('/logout', auth, async (req, res) => {
  try {
    await SyncLog.createLog({
      operation: 'info',
      entityType: 'auth',
      entityId: req.user._id,
      message: `User logged out: ${req.user.username}`,
      level: 'info',
      source: 'web',
      userId: req.user._id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;