const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const generateOTP = require('../utils/otpGenerator');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Send OTP to mobile number
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a mobile number'
      });
    }

    // Generate a 6-digit OTP
    const otp = generateOTP(6);

    // Save OTP to database
    await OTP.findOneAndUpdate(
      { mobileNumber },
      { mobileNumber, otp },
      { upsert: true, new: true }
    );

    // In a real application, you would send this OTP via SMS
    // For this demo, we'll just return it in the response
    console.log(`OTP for ${mobileNumber}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      // Only for development, remove in production
      otp: otp
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify OTP and login/register user
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide mobile number and OTP'
      });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({ mobileNumber, otp });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP or OTP expired'
      });
    }

    // Find user or create if not exists
    let user = await User.findOne({ mobileNumber });
    
    if (!user) {
      user = await User.create({ mobileNumber });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Delete the OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        mobileNumber: user.mobileNumber,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
