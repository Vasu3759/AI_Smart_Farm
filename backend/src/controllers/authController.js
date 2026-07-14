const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, identifier, password } = req.body;

    if (!name || !identifier || !password) {
      return res.status(400).json({ status: 'error', message: 'Please add all fields' });
    }

    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier } : { phone: identifier };

    // Check if user exists
    const userExists = await User.findOne(query);

    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      ...(isEmail ? { email: identifier } : { phone: identifier }),
      password,
    });

    if (user) {
      res.status(201).json({
        status: 'success',
        data: {
          _id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          token: generateToken(user._id),
        }
      });
    } else {
      res.status(400).json({ status: 'error', message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier } : { phone: identifier };

    // Check for user
    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      res.json({
        status: 'success',
        data: {
          _id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          token: generateToken(user._id),
        }
      });
    } else {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: req.user
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
