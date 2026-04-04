const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');

function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'rawwmart_secret_key',
    { expiresIn: '7d' }
  );
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    console.log('REGISTER HIT:', req.body);

    const {
      name, mobile, email, password, role,
      permanentAddress, deliveryAddress,
      gstNumber, latitude, longitude
    } = req.body;

    if (!name || !mobile || !email || !password || !role || !permanentAddress || !deliveryAddress) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existing = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existing) {
      return res.status(400).json({ message: 'This email or mobile is already registered.' });
    }

    // Hash password here directly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      mobile,
      email,
      password: hashedPassword,
      role,
      permanentAddress,
      deliveryAddress,
      gstNumber: gstNumber || '',
      gstVerified: role === 'supplier',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude) || 73.8567, parseFloat(latitude) || 18.5204]
      }
    });

    console.log('USER SAVED:', user._id);

    const token = generateToken(user._id);
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.log('ERROR NAME:', err.name);
    console.log('ERROR MSG:', err.message);
    console.log('ERROR CODE:', err.code);

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ message: `This ${field} is already registered.` });
    }
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    console.log('LOGIN HIT:', req.body);
    const { emailOrMobile, password } = req.body;

    if (!emailOrMobile || !password) {
      return res.status(400).json({ message: 'Please enter email/mobile and password.' });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }]
    });

    if (!user) {
      return res.status(401).json({ message: 'No account found with this email or mobile.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    const token = generateToken(user._id);
    console.log('LOGIN OK:', user.email);

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.log('LOGIN ERROR:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;