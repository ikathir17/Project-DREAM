const express = require('express');
const jwt = require('jsonwebtoken');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
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

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Submit a new complaint
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const {
      disasterType,
      urgencyLevel,
      location,
      coordinates,
      description,
      contactNumber,
      affectedPeople,
      resourcesNeeded,
      customHelp,
      audioRecording
    } = req.body;

    // Validate required fields
    if (!disasterType || !urgencyLevel || !location || !coordinates || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: disasterType, urgencyLevel, location, coordinates, description'
      });
    }

    // Validate coordinates
    if (!coordinates.lat || !coordinates.lng) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates (lat, lng) are required'
      });
    }

    // Validate resources needed
    if (!resourcesNeeded || !Array.isArray(resourcesNeeded) || resourcesNeeded.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one type of help/resource must be selected'
      });
    }

    // Process audio recording if provided
    let audioData = null;
    if (audioRecording) {
      try {
        // Validate base64 audio data
        if (typeof audioRecording === 'string' && audioRecording.startsWith('data:audio/')) {
          const base64Data = audioRecording.split(',')[1];
          const audioSize = Math.round((base64Data.length * 3) / 4); // Approximate size in bytes
          
          // Limit audio file size to 5MB
          if (audioSize > 5 * 1024 * 1024) {
            return res.status(400).json({
              success: false,
              message: 'Audio recording too large. Maximum size is 5MB.'
            });
          }
          
          audioData = {
            data: audioRecording,
            size: audioSize,
            mimeType: audioRecording.split(';')[0].split(':')[1] || 'audio/webm;codecs=opus',
            recordedAt: new Date()
          };
        }
      } catch (error) {
        console.error('Audio processing error:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid audio recording format'
        });
      }
    }

    // Create new complaint
    const complaint = new Complaint({
      submittedBy: req.user._id,
      submitterName: req.user.name,
      contactNumber: contactNumber || req.user.mobileNumber,
      disasterType,
      urgencyLevel,
      location: {
        address: location,
        coordinates: {
          lat: parseFloat(coordinates.lat),
          lng: parseFloat(coordinates.lng)
        }
      },
      description,
      affectedPeople: parseInt(affectedPeople) || 0,
      resourcesNeeded,
      customHelp: customHelp || '',
      audioRecording: audioData,
      status: 'pending'
    });

    // Add initial note
    let initialNote = 'Complaint submitted by user';
    if (audioData) {
      initialNote += ` (includes ${Math.round(audioData.size / 1024)}KB audio recording)`;
    }
    
    complaint.notes.push({
      content: initialNote,
      addedBy: req.user.name,
      addedAt: new Date()
    });

    await complaint.save();

    console.log(`📋 New complaint submitted by ${req.user.name} (ID: ${complaint._id})`);

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        complaintId: complaint._id,
        status: complaint.status,
        priority: complaint.priority,
        submittedAt: complaint.createdAt,
        estimatedResponse: getEstimatedResponseTime(complaint.urgencyLevel)
      }
    });

  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit complaint. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's complaints
router.get('/my-complaints', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const complaints = await Complaint.find({ submittedBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-notes'); // Exclude notes for list view

    const total = await Complaint.countDocuments({ submittedBy: req.user._id });

    res.json({
      success: true,
      data: {
        complaints,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints'
    });
  }
});

// Get complaint details by ID
router.get('/:complaintId', authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.complaintId,
      submittedBy: req.user._id
    }).populate('submittedBy', 'name mobileNumber');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      data: { complaint }
    });

  } catch (error) {
    console.error('Get complaint details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint details'
    });
  }
});

// Update complaint (limited fields for user)
router.put('/:complaintId', authenticateToken, async (req, res) => {
  try {
    const { description, contactNumber, affectedPeople, customHelp, audioRecording } = req.body;

    const complaint = await Complaint.findOne({
      _id: req.params.complaintId,
      submittedBy: req.user._id
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Only allow updates if complaint is still pending
    if (complaint.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update complaint after it has been processed'
      });
    }

    // Update allowed fields
    if (description) complaint.description = description;
    if (contactNumber) complaint.contactNumber = contactNumber;
    if (affectedPeople !== undefined) complaint.affectedPeople = parseInt(affectedPeople);
    if (customHelp !== undefined) complaint.customHelp = customHelp;
    
    // Handle audio recording update
    if (audioRecording !== undefined) {
      if (audioRecording === null) {
        // Remove audio recording
        complaint.audioRecording = undefined;
      } else if (typeof audioRecording === 'string' && audioRecording.startsWith('data:audio/')) {
        // Add/update audio recording
        try {
          const base64Data = audioRecording.split(',')[1];
          const audioSize = Math.round((base64Data.length * 3) / 4);
          
          if (audioSize > 5 * 1024 * 1024) {
            return res.status(400).json({
              success: false,
              message: 'Audio recording too large. Maximum size is 5MB.'
            });
          }
          
          complaint.audioRecording = {
            data: audioRecording,
            size: audioSize,
            mimeType: audioRecording.split(';')[0].split(':')[1] || 'audio/webm;codecs=opus',
            recordedAt: new Date()
          };
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: 'Invalid audio recording format'
          });
        }
      }
    }

    // Add update note
    complaint.notes.push({
      content: 'Complaint updated by user',
      addedBy: req.user.name,
      addedAt: new Date()
    });

    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      data: { complaint }
    });

  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint'
    });
  }
});

// Get audio recording for a complaint
router.get('/:complaintId/audio', authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.complaintId,
      submittedBy: req.user._id
    }).select('audioRecording');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (!complaint.audioRecording || !complaint.audioRecording.data) {
      return res.status(404).json({
        success: false,
        message: 'No audio recording found for this complaint'
      });
    }

    // Extract base64 data and convert to buffer
    const base64Data = complaint.audioRecording.data.split(',')[1];
    const audioBuffer = Buffer.from(base64Data, 'base64');
    
    // Set appropriate headers
    res.set({
      'Content-Type': complaint.audioRecording.mimeType || 'audio/webm',
      'Content-Length': audioBuffer.length,
      'Content-Disposition': `inline; filename="complaint-${req.params.complaintId}-audio.webm"`
    });

    res.send(audioBuffer);

  } catch (error) {
    console.error('Get audio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audio recording'
    });
  }
});

// Get complaints statistics for user
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Complaint.aggregate([
      { $match: { submittedBy: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$urgencyLevel', 'critical'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$urgencyLevel', 'high'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      critical: 0,
      high: 0
    };

    res.json({
      success: true,
      data: { stats: result }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Helper function to estimate response time based on urgency
function getEstimatedResponseTime(urgencyLevel) {
  const now = new Date();
  const responseTimeMap = {
    'critical': 30, // 30 minutes
    'high': 60,     // 1 hour
    'medium': 360,  // 6 hours
    'low': 1440     // 24 hours
  };
  
  const minutes = responseTimeMap[urgencyLevel] || 1440;
  const estimatedTime = new Date(now.getTime() + (minutes * 60 * 1000));
  
  return {
    minutes,
    estimatedAt: estimatedTime,
    description: `Expected response within ${minutes < 60 ? minutes + ' minutes' : Math.floor(minutes / 60) + ' hours'}`
  };
}

module.exports = router;
