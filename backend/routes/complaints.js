const express = require('express');
const jwt = require('jsonwebtoken');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const router = express.Router();


// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 Authentication middleware called');
    console.log('🔐 Request body in auth middleware:', req.body);
    console.log('🔐 Request headers:', req.headers.authorization);
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET environment variable is missing');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
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
    // Debug logging
    console.log('📋 Complaint submission request received');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body:', req.body);
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', req.body ? Object.keys(req.body) : 'No body');

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing. Please ensure Content-Type is application/json'
      });
    }

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
      audioRecording,
      images
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

    // Process images if provided
    let processedImages = [];
    if (images && Array.isArray(images) && images.length > 0) {
      try {
        // Validate image count
        if (images.length > 5) {
          return res.status(400).json({
            success: false,
            message: 'Too many images. Maximum 5 images allowed.'
          });
        }

        for (const image of images) {
          // Validate required image fields
          if (!image.data || !image.filename || !image.mimeType || !image.size) {
            return res.status(400).json({
              success: false,
              message: 'Invalid image format. Missing required fields.'
            });
          }

          // Validate image type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(image.mimeType)) {
            return res.status(400).json({
              success: false,
              message: `Invalid image type: ${image.mimeType}. Allowed types: ${allowedTypes.join(', ')}`
            });
          }

          // Validate image size (5MB limit)
          if (image.size > 5 * 1024 * 1024) {
            return res.status(400).json({
              success: false,
              message: `Image ${image.filename} is too large. Maximum size is 5MB.`
            });
          }

          // Validate base64 data
          if (!image.data.startsWith('data:image/')) {
            return res.status(400).json({
              success: false,
              message: `Invalid image data format for ${image.filename}`
            });
          }

          processedImages.push({
            data: image.data,
            filename: image.filename,
            mimeType: image.mimeType,
            size: image.size,
            description: image.description || '',
            uploadedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Image processing error:', error);
        return res.status(400).json({
          success: false,
          message: 'Error processing images. Please try again.'
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
      images: processedImages,
      status: 'pending'
    });

    // Add initial note
    let initialNote = 'Complaint submitted by user';
    if (audioData) {
      initialNote += ` (includes ${Math.round(audioData.size / 1024)}KB audio recording)`;
    }
    if (processedImages.length > 0) {
      initialNote += ` (includes ${processedImages.length} image${processedImages.length > 1 ? 's' : ''})`;
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
    console.error('Error stack:', error.stack);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.message,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Handle document size exceeded error
    if (error.message && error.message.includes('BSONObj size')) {
      return res.status(413).json({
        success: false,
        message: 'Request too large. Please reduce image sizes or count.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
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

// Get nearby complaints within 5km radius
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, page = 1, limit = 20 } = req.query;

    // Validate coordinates
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates out of valid range'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Calculate bounding box for approximate 5km radius
    const kmInDegrees = 5 / 111; // Rough conversion: 1 degree ≈ 111 km
    const latMin = latitude - kmInDegrees;
    const latMax = latitude + kmInDegrees;
    const lngMin = longitude - kmInDegrees;
    const lngMax = longitude + kmInDegrees;

    console.log(`🔍 Searching for complaints in bounding box:`, {
      latMin, latMax, lngMin, lngMax,
      userLat: latitude, userLng: longitude
    });

    // Find complaints within approximate 5km bounding box
    const nearbyComplaints = await Complaint.aggregate([
      {
        $match: {
          isActive: true,
          status: { $in: ['pending', 'acknowledged', 'in_progress'] },
          'location.coordinates.lat': { $gte: latMin, $lte: latMax },
          'location.coordinates.lng': { $gte: lngMin, $lte: lngMax }
        }
      },
      {
        $addFields: {
          // Simple distance approximation in km
          distanceKm: {
            $round: [
              {
                $multiply: [
                  111, // Rough km per degree
                  {
                    $sqrt: {
                      $add: [
                        { $pow: [{ $subtract: ['$location.coordinates.lat', latitude] }, 2] },
                        { $pow: [{ $subtract: ['$location.coordinates.lng', longitude] }, 2] }
                      ]
                    }
                  }
                ]
              },
              2
            ]
          }
        }
      },
      {
        $match: {
          distanceKm: { $lte: 5 } // Filter to actual 5km radius
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'submittedBy',
          foreignField: '_id',
          as: 'submitter',
          pipeline: [
            { $project: { name: 1, mobileNumber: 1 } }
          ]
        }
      },
      {
        $addFields: {
          submitter: { $arrayElemAt: ['$submitter', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          disasterType: 1,
          urgencyLevel: 1,
          status: 1,
          priority: 1,
          'location.address': 1,
          'location.coordinates': 1,
          description: 1,
          affectedPeople: 1,
          resourcesNeeded: 1,
          customHelp: 1,
          submitterName: 1,
          contactNumber: 1,
          createdAt: 1,
          updatedAt: 1,
          distanceKm: 1,
          submitter: 1,
          // Exclude sensitive data like images, audio, and detailed notes
          images: { $size: { $ifNull: ['$images', []] } }, // Just count of images
          hasAudio: { $cond: [{ $ifNull: ['$audioRecording.data', false] }, true, false] }
        }
      },
      { $sort: { distanceKm: 1, priority: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum }
    ]);

    // Get total count for pagination using same bounding box approach
    const totalCount = await Complaint.aggregate([
      {
        $match: {
          isActive: true,
          status: { $in: ['pending', 'acknowledged', 'in_progress'] },
          'location.coordinates.lat': { $gte: latMin, $lte: latMax },
          'location.coordinates.lng': { $gte: lngMin, $lte: lngMax }
        }
      },
      {
        $addFields: {
          distanceKm: {
            $round: [
              {
                $multiply: [
                  111,
                  {
                    $sqrt: {
                      $add: [
                        { $pow: [{ $subtract: ['$location.coordinates.lat', latitude] }, 2] },
                        { $pow: [{ $subtract: ['$location.coordinates.lng', longitude] }, 2] }
                      ]
                    }
                  }
                ]
              },
              2
            ]
          }
        }
      },
      {
        $match: {
          distanceKm: { $lte: 5 }
        }
      },
      { $count: 'total' }
    ]);

    const total = totalCount[0]?.total || 0;

    console.log(`🔍 Found ${nearbyComplaints.length} complaints, total: ${total}`);

    res.json({
      success: true,
      data: {
        complaints: nearbyComplaints,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        searchCenter: {
          lat: latitude,
          lng: longitude
        },
        radiusKm: 5
      }
    });

  } catch (error) {
    console.error('Get nearby complaints error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby complaints',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// Get images for a complaint
router.get('/:complaintId/images', authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.complaintId,
      submittedBy: req.user._id
    }).select('images');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (!complaint.images || complaint.images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No images found for this complaint'
      });
    }

    // Return image metadata (without base64 data for list view)
    const imageList = complaint.images.map((img, index) => ({
      index,
      filename: img.filename,
      mimeType: img.mimeType,
      size: img.size,
      description: img.description,
      uploadedAt: img.uploadedAt
    }));

    res.json({
      success: true,
      data: { images: imageList }
    });

  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch images'
    });
  }
});

// Get specific image from a complaint
router.get('/:complaintId/images/:imageIndex', authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.complaintId,
      submittedBy: req.user._id
    }).select('images');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= complaint.images.length) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const image = complaint.images[imageIndex];
    
    // Extract base64 data and convert to buffer
    const base64Data = image.data.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Set appropriate headers
    res.set({
      'Content-Type': image.mimeType,
      'Content-Length': imageBuffer.length,
      'Content-Disposition': `inline; filename="${image.filename}"`
    });

    res.send(imageBuffer);

  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch image'
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
