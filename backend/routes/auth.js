const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// In-memory OTP storage (for development/testing only)
const otpStore = new Map();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [mobileNumber, otpData] of otpStore.entries()) {
    if (otpData.expiresAt < now) {
      otpStore.delete(mobileNumber);
      console.log(`🧹 Cleaned up expired OTP for ${mobileNumber}`);
    }
  }
}, 5 * 60 * 1000); // 5 minutes

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to mobile number
router.post('/send-otp', async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    // Validate mobile number
    if (!mobileNumber || !/^[0-9]{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes from now
    
    // Store OTP in memory
    otpStore.set(mobileNumber, {
      otp,
      expiresAt,
      attempts: 0
    });
    
    // In a real app, you would send SMS here
    // For now, we'll return the OTP for testing
    console.log(`📱 OTP for ${mobileNumber}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        mobileNumber,
        otp: otp, // Only for testing - remove in production
        expiresIn: 300 // 5 minutes
      }
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
});

// Verify OTP and login/register user
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    // Validate input
    if (!mobileNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and OTP are required'
      });
    }

    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number'
      });
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit OTP'
      });
    }

    // Verify OTP from memory
    console.log(`🔍 Verifying OTP for ${mobileNumber}: ${otp}`);
    
    const storedOTP = otpStore.get(mobileNumber);
    
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new OTP.'
      });
    }
    
    if (storedOTP.attempts >= 3) {
      otpStore.delete(mobileNumber);
      return res.status(400).json({
        success: false,
        message: 'Too many attempts. Please request a new OTP.'
      });
    }
    
    if (storedOTP.expiresAt < Date.now()) {
      otpStore.delete(mobileNumber);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }
    
    if (storedOTP.otp !== otp) {
      storedOTP.attempts += 1;
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }
    
    // OTP is valid - remove it from memory
    otpStore.delete(mobileNumber);
    console.log(`✅ OTP verified successfully for ${mobileNumber}`);

    // Check if user exists
    let user = await User.findOne({ mobileNumber });

    if (user) {
      // Existing user - update login info
      await user.updateLoginInfo();
      console.log(`👤 Existing user logged in: ${mobileNumber}`);
    } else {
      // New user - create account
      user = new User({
        mobileNumber,
        name: `User ${mobileNumber.slice(-4)}`, // Default name
        isActive: true
      });
      await user.save();
      console.log(`🆕 New user created: ${mobileNumber}`);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Get user stats
    const stats = user.getStats();

    res.json({
      success: true,
      message: user.isNew ? 'Account created successfully' : 'Login successful',
      data: {
        user: {
          id: user._id,
          mobileNumber: user.mobileNumber,
          name: user.name,
          email: user.email,
          bio: user.bio,
          stats: stats
        },
        token,
        isNewUser: !!user.isNew
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const stats = user.getStats();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          mobileNumber: user.mobileNumber,
          name: user.name,
          email: user.email,
          bio: user.bio,
          stats: stats
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, email, bio } = req.body;

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    const stats = user.getStats();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          mobileNumber: user.mobileNumber,
          name: user.name,
          email: user.email,
          bio: user.bio,
          stats: stats
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Logout (optional - mainly for token blacklisting in production)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
