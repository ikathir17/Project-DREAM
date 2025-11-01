const Complaint = require('../models/Complaint');
const { PythonShell } = require('python-shell');
const path = require('path');

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private
exports.createComplaint = async (req, res) => {
  try {
    const { text, type, helpNeeded } = req.body;
    let { location } = req.body;

    // Validate required fields
    if (!text || !type || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: text, type, and location',
      });
    }

    // --- Data Parsing and Validation ---
    let parsedLocation;
    try {
      parsedLocation = JSON.parse(location);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid location data format' });
    }

    let parsedHelpNeeded = [];
    if (helpNeeded) {
      try {
        parsedHelpNeeded = JSON.parse(helpNeeded);
        if (!Array.isArray(parsedHelpNeeded)) {
            throw new Error('helpNeeded must be an array.');
        }
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid helpNeeded data format' });
      }
    }

    // --- Complaint Data Construction ---
    const complaintData = {
      userId: req.user.id,
      text,
      type,
      location: parsedLocation,
      helpNeeded: parsedHelpNeeded,
      image: req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : null,
      audio: req.files?.audio?.[0] ? `/uploads/${req.files.audio[0].filename}` : null,
    };

    // --- Database Operation ---
    const complaint = await Complaint.create(complaintData);

    // --- Post-creation Asynchronous Tasks (Spam and Disaster Classification) ---
    const spamOptions = {
      mode: 'text',
      pythonPath: 'python',
      scriptPath: path.join(__dirname, '../python'),
      args: [complaint.text],
    };

    // Spam Classification
    PythonShell.run('spam_classifier.py', spamOptions, async (err, results) => {
      if (err) {
        console.error('Spam classifier error:', err);
        return;
      }
      if (results && results[0]) {
        const isSpam = results[0].trim().toLowerCase() === 'spam';
        await Complaint.findByIdAndUpdate(complaint._id, { isSpam });
        console.log(`Complaint ${complaint._id} spam classification: ${isSpam}`);
      }
    });

    // Disaster Classification (only for text-based complaints without media)
    const hasMedia = complaint.image || complaint.audio;
    
    if (!hasMedia) {
      // Auto-verify text-only complaints using ML model
      const disasterOptions = {
        mode: 'text',
        pythonPath: 'python',
        scriptPath: path.join(__dirname, '../python'),
        args: [complaint.text],
      };

      PythonShell.run('disaster_classifier.py', disasterOptions, async (err, results) => {
        if (err) {
          console.error('Disaster classifier error:', err);
          return;
        }
        if (results && results[0]) {
          const classificationResult = results[0].trim().toLowerCase();
          const isVerified = classificationResult === 'verified';
          await Complaint.findByIdAndUpdate(complaint._id, { 
            verified: isVerified,
            autoVerified: true // Flag to indicate automatic verification
          });
          console.log(`Complaint ${complaint._id} auto-verified: ${classificationResult} (verified: ${isVerified})`);
        }
      });
    } else {
      // Leave media complaints for manual verification
      console.log(`Complaint ${complaint._id} contains media - requires manual verification`);
      await Complaint.findByIdAndUpdate(complaint._id, { 
        verified: false,
        autoVerified: false,
        requiresManualVerification: true
      });
    }

    // --- Success Response ---
    res.status(201).json({
      success: true,
      data: complaint,
    });

  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating complaint',
    });
  }
};

// @desc    Get all complaints for the current user
// @route   GET /api/complaints
// @access  Private
exports.getUserComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get a single complaint
// @route   GET /api/complaints/:id
// @access  Private
exports.getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if the complaint belongs to the user or user is admin
    if (complaint.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this complaint'
      });
    }

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id
// @access  Private
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }

    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if the complaint belongs to the user or user is admin
    if (complaint.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this complaint'
      });
    }

    complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get nearby verified complaints
// @route   GET /api/complaints/nearby
// @access  Private
exports.getNearbyComplaints = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query; // maxDistance in meters

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide longitude and latitude'
      });
    }

    const complaints = await Complaint.find({
      verified: true,
      isSpam: false,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all non-spam complaints (admin only)
// @route   GET /api/complaints/admin
// @access  Private/Admin
exports.getAdminComplaints = async (req, res) => {
  try {
    // Get all non-spam complaints that are either:
    // 1. Auto-verified (text-only complaints processed by ML)
    // 2. Manually verified and approved
    // 3. Not requiring manual verification
    const complaints = await Complaint.find({ 
      isSpam: false,
      $or: [
        // Auto-verified complaints (text-only)
        { autoVerified: true },
        // Manually verified and approved
        { requiresManualVerification: false, verified: true },
        // Old complaints that don't have the manual verification field
        { requiresManualVerification: { $exists: false } }
      ]
    })
    .populate('userId', 'name mobileNumber')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get urgent complaints (older than 5 hours and not in progress)
// @route   GET /api/complaints/urgent
// @access  Private/Admin
exports.getUrgentComplaints = async (req, res) => {
  try {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);

    const complaints = await Complaint.find({
      isSpam: false,
      status: { $ne: 'in_progress' },
      createdAt: { $lt: fiveHoursAgo },
      $or: [
        // Auto-verified complaints (text-only)
        { autoVerified: true },
        // Manually verified and approved
        { requiresManualVerification: false, verified: true },
        // Old complaints that don't have the manual verification field
        { requiresManualVerification: { $exists: false } }
      ]
    })
    .populate('userId', 'name mobileNumber')
    .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get complaint statistics (admin only)
// @route   GET /api/complaints/stats
// @access  Private/Admin
exports.getComplaintStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Get total complaints for the current month
    const totalComplaints = await Complaint.countDocuments({
      createdAt: { $gte: firstDayOfMonth }
    });

    // Get resolved complaints for the current month
    const resolvedComplaints = await Complaint.countDocuments({
      status: 'resolved',
      createdAt: { $gte: firstDayOfMonth }
    });

    // Get in-progress complaints for the current month
    const inProgressComplaints = await Complaint.countDocuments({
      status: 'in_progress',
      createdAt: { $gte: firstDayOfMonth }
    });

    // Get pending complaints for the current month
    const pendingComplaints = await Complaint.countDocuments({
      status: 'pending',
      createdAt: { $gte: firstDayOfMonth }
    });

    // Get complaints requiring manual verification
    const manualVerificationPending = await Complaint.countDocuments({
      requiresManualVerification: true,
      isSpam: false
    });

    // Get verified complaints (auto + manual)
    const verifiedComplaints = await Complaint.countDocuments({
      verified: true,
      isSpam: false,
      createdAt: { $gte: firstDayOfMonth }
    });

    // Get auto-verified complaints
    const autoVerifiedComplaints = await Complaint.countDocuments({
      autoVerified: true,
      createdAt: { $gte: firstDayOfMonth }
    });

    // Get manually verified complaints
    const manuallyVerifiedComplaints = await Complaint.countDocuments({
      requiresManualVerification: false,
      verified: true,
      autoVerified: false,
      createdAt: { $gte: firstDayOfMonth }
    });

    // Calculate resolution rate
    const resolutionRate = totalComplaints > 0 
      ? (resolvedComplaints / totalComplaints) * 100 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalComplaints,
        resolvedComplaints,
        inProgressComplaints,
        pendingComplaints,
        verifiedComplaints,
        autoVerifiedComplaints,
        manuallyVerifiedComplaints,
        manualVerificationPending,
        resolutionRate: resolutionRate.toFixed(2)
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

// @desc    Get complaints requiring manual verification (admin only)
// @route   GET /api/complaints/manual-verification
// @access  Private/Admin
exports.getManualVerificationComplaints = async (req, res) => {
  try {
    // Get pending manual verification complaints
    const pendingComplaints = await Complaint.find({
      requiresManualVerification: true,
      isSpam: false
    })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

    // Get rejected complaints that can be re-reviewed
    const rejectedComplaints = await Complaint.find({
      requiresManualVerification: false,
      verified: false,
      autoVerified: false,
      isSpam: false,
      $or: [
        { image: { $exists: true, $ne: null } },
        { audio: { $exists: true, $ne: null } }
      ]
    })
    .populate('userId', 'name email')
    .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingComplaints.length,
      data: {
        pending: pendingComplaints,
        rejected: rejectedComplaints
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

// @desc    Manually verify a complaint (admin only)
// @route   PUT /api/complaints/:id/manual-verify
// @access  Private/Admin
exports.manualVerifyComplaint = async (req, res) => {
  try {
    const { verified, reason } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { 
        verified: verified,
        requiresManualVerification: false,
        autoVerified: false,
        manualVerificationReason: reason,
        updatedAt: Date.now() 
      },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.status(200).json({
      success: true,
      data: complaint,
      message: `Complaint ${verified ? 'verified' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Re-verify a rejected complaint (admin only)
// @route   PUT /api/complaints/:id/re-verify
// @access  Private/Admin
exports.reVerifyComplaint = async (req, res) => {
  try {
    const { verified, reason } = req.body;

    // Find the complaint and check if it's eligible for re-verification
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if complaint was previously rejected and has media
    if (complaint.verified === true || complaint.requiresManualVerification === true) {
      return res.status(400).json({
        success: false,
        message: 'This complaint is not eligible for re-verification'
      });
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { 
        verified: verified,
        requiresManualVerification: false,
        autoVerified: false,
        manualVerificationReason: `Re-verified: ${reason}`,
        updatedAt: Date.now() 
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedComplaint,
      message: `Complaint ${verified ? 'approved on re-verification' : 'rejected again'} successfully`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify a complaint (admin only) - Legacy endpoint
// @route   PUT /api/complaints/:id/verify
// @access  Private/Admin
exports.verifyComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { verified: true, updatedAt: Date.now() },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
