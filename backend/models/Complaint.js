const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  // User Information
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submitterName: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/
  },
  
  // Disaster Information
  disasterType: {
    type: String,
    required: true,
    enum: ['flood', 'earthquake', 'fire', 'cyclone', 'landslide', 'drought', 'accident', 'medical', 'other']
  },
  urgencyLevel: {
    type: String,
    required: true,
    enum: ['critical', 'high', 'medium', 'low']
  },
  
  // Location Information
  location: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    }
  },
  
  // Incident Details
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  affectedPeople: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Help/Resources Needed
  resourcesNeeded: [{
    type: String,
    enum: ['medical', 'rescue', 'food', 'shelter', 'clothing', 'transport', 'communication', 'power', 'cleanup', 'security', 'psychological', 'financial']
  }],
  customHelp: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Audio Recording
  audioRecording: {
    data: {
      type: String, // Base64 encoded audio data
      maxlength: 10485760 // 10MB limit for base64 audio
    },
    duration: {
      type: Number, // Duration in seconds
      min: 0
    },
    size: {
      type: Number, // File size in bytes
      min: 0
    },
    mimeType: {
      type: String,
      default: 'audio/webm;codecs=opus'
    },
    recordedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Status and Tracking
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: function() {
      // Auto-assign priority based on urgency level
      const priorityMap = {
        'critical': 1,
        'high': 2,
        'medium': 3,
        'low': 4
      };
      return priorityMap[this.urgencyLevel] || 5;
    }
  },
  
  // Response Information
  assignedTo: {
    type: String,
    trim: true
  },
  responseTeam: {
    type: String,
    trim: true
  },
  estimatedResponseTime: {
    type: Date
  },
  actualResponseTime: {
    type: Date
  },
  
  // Additional Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: [{
    content: {
      type: String,
      required: true
    },
    addedBy: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ disasterType: 1 });
complaintSchema.index({ urgencyLevel: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ 'location.coordinates': '2dsphere' }); // For geospatial queries
complaintSchema.index({ submittedBy: 1 });

// Virtual for complaint age
complaintSchema.virtual('age').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  return diffHours;
});

// Virtual for response time (if resolved)
complaintSchema.virtual('responseTimeHours').get(function() {
  if (this.actualResponseTime && this.createdAt) {
    const diffTime = Math.abs(this.actualResponseTime - this.createdAt);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours;
  }
  return null;
});

// Pre-save middleware to update timestamps
complaintSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set resolvedAt when status changes to resolved
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  
  next();
});

// Method to add a note
complaintSchema.methods.addNote = function(content, addedBy) {
  this.notes.push({
    content: content,
    addedBy: addedBy,
    addedAt: new Date()
  });
  return this.save();
};

// Method to update status
complaintSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  
  if (newStatus === 'resolved') {
    this.resolvedAt = new Date();
  }
  
  // Add status change note
  this.notes.push({
    content: `Status changed to: ${newStatus}`,
    addedBy: updatedBy || 'System',
    addedAt: new Date()
  });
  
  return this.save();
};

// Static method to get complaints by location radius
complaintSchema.statics.findByLocation = function(lat, lng, radiusInKm = 10) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    }
  });
};

// Static method to get urgent complaints
complaintSchema.statics.getUrgentComplaints = function() {
  return this.find({
    urgencyLevel: { $in: ['critical', 'high'] },
    status: { $in: ['pending', 'acknowledged', 'in_progress'] },
    isActive: true
  }).sort({ priority: 1, createdAt: 1 });
};

module.exports = mongoose.model('Complaint', complaintSchema);
