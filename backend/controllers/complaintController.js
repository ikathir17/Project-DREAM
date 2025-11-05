const Complaint = require('../models/Complaint');
const { validateDisasterComplaint } = require('../utils/geminiValidator');
const { runSpamClassifier, runDisasterClassifier } = require('../utils/mlValidators');
const { notifyComplaintVerified, notifyComplaintRejected, notifyComplaintInProgress, notifyComplaintResolved } = require('../utils/notificationHelper');

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
      requiresManualVerification: true // ALL complaints start as requiring manual verification
    };

    // --- Database Operation ---
    const complaint = await Complaint.create(complaintData);
    console.log(`\n🆕 New complaint created: ${complaint._id}`);
    console.log(`Type: ${complaint.type}, Text: ${complaint.text.substring(0, 50)}...`);

    // --- SYNCHRONOUS VALIDATION PROCESS ---
    // Check if complaint has media (image or audio)
    const hasMedia = complaint.image || complaint.audio;
    
    if (hasMedia) {
      // Complaints with media ALWAYS require manual verification
      console.log(`📎 Complaint ${complaint._id} contains media - requires manual verification`);
      await Complaint.findByIdAndUpdate(complaint._id, {
        verified: false,
        requiresManualVerification: true,
        validationReason: 'Contains media - requires manual verification'
      });
      
      return res.status(201).json({
        success: true,
        data: await Complaint.findById(complaint._id),
        message: 'Complaint submitted. Media attachments require manual verification.'
      });
    }

    // For text-only complaints, run Gemini validation only (ML models skipped for performance)
    console.log(`\n🔍 Starting validation process for complaint ${complaint._id}...`);
    console.log(`⚡ Fast mode: Using Gemini AI only (ML models skipped)`);
    
    // Step 1: Run Gemini AI Validation
    console.log(`\n1️⃣ Running Gemini AI validation...`);
    let geminiVerified = null;
    let geminiResult = null;
    
    try {
      geminiResult = await validateDisasterComplaint(complaint.type, complaint.text);
      geminiVerified = geminiResult.isValid;
      console.log(`Gemini Result: ${geminiVerified ? 'YES ✅' : 'NO ❌'}`);
    } catch (error) {
      console.log(`⚠️ Gemini validation unavailable: ${error.message}`);
      geminiVerified = null;
    }
    
    // Step 2: Apply Decision Logic (Gemini only)
    console.log(`\n📊 Decision Logic (Gemini AI only):`);
    console.log(`   Gemini AI: ${geminiVerified === null ? 'UNAVAILABLE' : (geminiVerified ? 'YES' : 'NO')}`);
    
    let finalVerified = false;
    let requiresManual = true;
    let validationReason = '';
    const mlVerified = null; // ML skipped
    
    // Simplified Decision Logic (Gemini only):
    // 1. If Gemini YES → Auto-approve
    // 2. If Gemini NO → Manual verification
    // 3. If Gemini unavailable → Manual verification
    
    if (geminiVerified === true) {
      // Gemini verified → Auto-approve
      finalVerified = true;
      requiresManual = false;
      validationReason = 'Verified by Gemini AI';
      console.log(`✅ DECISION: AUTO-APPROVED (Gemini verified)`);
    } else if (geminiVerified === false) {
      // Gemini rejected → Manual verification
      finalVerified = false;
      requiresManual = true;
      validationReason = 'Rejected by Gemini AI - requires manual review';
      console.log(`❌ DECISION: MANUAL VERIFICATION REQUIRED (Gemini rejected)`);
    } else {
      // Gemini unavailable → Manual verification
      finalVerified = false;
      requiresManual = true;
      validationReason = 'Gemini AI unavailable - requires manual review';
      console.log(`❌ DECISION: MANUAL VERIFICATION REQUIRED (Gemini unavailable)`);
    }
    
    // Step 4: Update database with final decision
    console.log(`\n💾 Updating database with final decision...`);
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaint._id,
      {
        isSpam: false,
        verified: finalVerified,
        requiresManualVerification: requiresManual,
        autoVerified: !requiresManual,
        validationReason: validationReason,
        mlValidation: {
          isVerified: mlVerified,
          validatedAt: new Date()
        },
        geminiValidation: geminiResult ? {
          isValid: geminiVerified,
          confidence: geminiResult.confidence,
          validatedAt: new Date()
        } : null
      },
      { new: true }
    );
    
    console.log(`✅ Complaint ${complaint._id} validation complete!`);
    console.log(`   Final Status: ${finalVerified ? 'VERIFIED ✅' : 'NOT VERIFIED ❌'}`);
    console.log(`   Manual Review: ${requiresManual ? 'REQUIRED ⚠️' : 'NOT NEEDED ✅'}`);
    
    // Create notification for user about complaint status
    if (finalVerified) {
      await notifyComplaintVerified(req.user.id, complaint._id, complaint.type);
      console.log(`📬 Notification sent: Complaint verified`);
    } else {
      await notifyComplaintRejected(req.user.id, complaint._id, complaint.type, validationReason);
      console.log(`📬 Notification sent: Complaint requires manual review`);
    }
    
    // Step 3: If NOT verified, run spam check (optional - can be skipped for speed)
    // Spam check is also skipped for now to maximize speed
    console.log(`\n⏭️  Spam check skipped (fast mode enabled)`);
    
    // Uncomment below to enable spam check for non-verified complaints:
    /*
    if (!finalVerified) {
      console.log(`\n3️⃣ Running spam check (complaint not verified)...`);
      const spamResult = await runSpamClassifier(complaint.text);
      
      if (spamResult.isSpam) {
        console.log(`❌ Complaint ${complaint._id} marked as SPAM`);
        await Complaint.findByIdAndUpdate(complaint._id, {
          isSpam: true,
          validationReason: validationReason + ' + Marked as spam by classifier'
        });
        
        return res.status(201).json({
          success: true,
          data: await Complaint.findById(complaint._id),
          message: 'Complaint submitted but flagged as potential spam. Requires manual verification.'
        });
      } else {
        console.log(`✅ Not spam - manual verification required for other reasons`);
      }
    }
    */
    
    console.log();

    // --- Success Response ---
    res.status(201).json({
      success: true,
      data: updatedComplaint,
      message: finalVerified 
        ? 'Complaint verified and submitted successfully!' 
        : 'Complaint submitted and requires manual verification.'
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

    const oldStatus = complaint.status;
    
    complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    // Send notification based on status change
    if (oldStatus !== status) {
      if (status === 'in_progress') {
        await notifyComplaintInProgress(complaint.userId, complaint._id, complaint.type);
        console.log(`📬 Notification sent: Status changed to In Progress`);
      } else if (status === 'resolved') {
        await notifyComplaintResolved(complaint.userId, complaint._id, complaint.type);
        console.log(`📬 Notification sent: Status changed to Resolved`);
      }
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
      requiresManualVerification: false, // Only show complaints that have been fully verified
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    })
    .populate('userId', 'name email')
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

// @desc    Get all non-spam complaints (admin only)
// @route   GET /api/complaints/admin
// @access  Private/Admin
exports.getAdminComplaints = async (req, res) => {
  try {
    // Get all verified, non-spam complaints that don't require manual verification
    // This includes:
    // 1. AI-verified complaints (verified by disaster classifier)
    // 2. Admin-verified complaints (manually approved)
    const complaints = await Complaint.find({ 
      verified: true,
      isSpam: false,
      requiresManualVerification: false
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

// @desc    Get urgent complaints (older than 2 hours, verified, and still pending)
// @route   GET /api/complaints/urgent
// @access  Private/Admin
exports.getUrgentComplaints = async (req, res) => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const complaints = await Complaint.find({
      verified: true,
      isSpam: false,
      requiresManualVerification: false,
      status: 'pending', // Only show pending complaints (exclude in_progress and resolved)
      createdAt: { $lt: twoHoursAgo }
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

    // Base query for verified complaints only (excluding spam and unverified)
    const verifiedQuery = {
      verified: true,
      isSpam: false,
      createdAt: { $gte: firstDayOfMonth }
    };

    // Get total VERIFIED complaints for the current month
    const totalComplaints = await Complaint.countDocuments(verifiedQuery);

    // Get resolved complaints (verified only)
    const resolvedComplaints = await Complaint.countDocuments({
      ...verifiedQuery,
      status: 'resolved'
    });

    // Get in-progress complaints (verified only)
    const inProgressComplaints = await Complaint.countDocuments({
      ...verifiedQuery,
      status: 'in_progress'
    });

    // Get pending complaints (verified only)
    const pendingComplaints = await Complaint.countDocuments({
      ...verifiedQuery,
      status: 'pending'
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
      verified: true,
      autoVerified: true,
      isSpam: false,
      createdAt: { $gte: firstDayOfMonth }
    });

    // Get manually verified complaints
    const manuallyVerifiedComplaints = await Complaint.countDocuments({
      requiresManualVerification: false,
      verified: true,
      autoVerified: false,
      isSpam: false,
      createdAt: { $gte: firstDayOfMonth }
    });

    // Calculate resolution rate (based on verified complaints only)
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
    // Get ALL complaints requiring manual verification (includes media, AI-rejected, and spam)
    // This now includes:
    // 1. Complaints with media (image/audio)
    // 2. AI-rejected text complaints
    // 3. Spam complaints
    const pendingComplaints = await Complaint.find({
      requiresManualVerification: true,
      isSpam: false,
      verified: false
    })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

    // Get manually rejected complaints (admin rejected after review)
    const rejectedComplaints = await Complaint.find({
      requiresManualVerification: false,
      verified: false,
      autoVerified: false,
      isSpam: false
    })
    .populate('userId', 'name email')
    .sort({ updatedAt: -1 });

    // Get AI-rejected complaints (for separate tab - text-only rejected by AI)
    const aiRejectedComplaints = await Complaint.find({
      verified: false,
      isSpam: false,
      requiresManualVerification: true,
      // Text-only complaints (no media)
      image: { $in: [null, ''] },
      audio: { $in: [null, ''] },
      // Must have been processed by Gemini AI and rejected
      'geminiValidation.isValid': false
    })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

    // Get spam complaints (all complaints marked as spam by AI)
    const spamComplaints = await Complaint.find({
      isSpam: true
    })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingComplaints.length,
      data: {
        pending: pendingComplaints,
        rejected: rejectedComplaints,
        aiRejected: aiRejectedComplaints,
        spam: spamComplaints
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
        status: verified ? 'pending' : 'rejected', // Update status based on verification
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

    // Send notification to user
    if (verified) {
      await notifyComplaintVerified(complaint.userId, complaint._id, complaint.type);
      console.log(`📬 Notification sent: Complaint manually verified by admin`);
    } else {
      await notifyComplaintRejected(complaint.userId, complaint._id, complaint.type, reason);
      console.log(`📬 Notification sent: Complaint manually rejected by admin`);
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

// @desc    Override AI rejection and manually verify/reject (admin only)
// @route   PUT /api/complaints/:id/override-ai
// @access  Private/Admin
exports.overrideAIRejection = async (req, res) => {
  try {
    const { verified, reason } = req.body;

    // Find the complaint and check if it's AI-rejected
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if complaint was auto-verified and rejected by AI
    if (!complaint.autoVerified || complaint.verified === true) {
      return res.status(400).json({
        success: false,
        message: 'This complaint was not rejected by AI or is already verified'
      });
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { 
        verified: verified,
        autoVerified: false, // Override AI decision
        requiresManualVerification: false, // Admin reviewed - no longer needs manual verification
        manualVerificationReason: `AI Override: ${reason}`,
        updatedAt: Date.now() 
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedComplaint,
      message: `AI decision overridden - Complaint ${verified ? 'verified' : 'rejected'} by admin`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Override spam classification (admin only)
// @route   PUT /api/complaints/:id/override-spam
// @access  Private/Admin
exports.overrideSpamClassification = async (req, res) => {
  try {
    const { isSpam, reason } = req.body;

    // Find the complaint
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Update spam status
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { 
        isSpam: isSpam,
        requiresManualVerification: false, // Admin reviewed - no longer needs manual verification
        verified: !isSpam, // If not spam, mark as verified; if spam, keep as not verified
        manualVerificationReason: `Spam Override: ${reason}`,
        updatedAt: Date.now() 
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedComplaint,
      message: `Spam classification overridden - Complaint marked as ${isSpam ? 'spam' : 'not spam'} by admin`
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

// @desc    Get ALL complaints for report generation (admin only)
// @route   GET /api/complaints/admin/all
// @access  Private/Admin
exports.getAllComplaintsForReport = async (req, res) => {
  try {
    // Get ALL complaints including spam, verified, and unverified
    const complaints = await Complaint.find({})
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

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
