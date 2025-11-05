const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  image: {
    type: String // Path to the image file
  },
  audio: {
    type: String // Path to the audio file
  },
  helpNeeded: {
    type: [String], // Array of help types needed
    default: []
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved'],
    default: 'pending'
  },
  verified: {
    type: Boolean,
    default: false
  },
  autoVerified: {
    type: Boolean,
    default: false
  },
  requiresManualVerification: {
    type: Boolean,
    default: false
  },
  manualVerificationReason: {
    type: String
  },
  isSpam: {
    type: Boolean,
    default: false
  },
  mlValidation: {
    isVerified: {
      type: Boolean,
      default: null
    },
    validatedAt: {
      type: Date
    }
  },
  geminiValidation: {
    isValid: {
      type: Boolean,
      default: null
    },
    confidence: {
      type: String
    },
    validatedAt: {
      type: Date
    }
  },
  geminiRejected: {
    type: Boolean,
    default: false
  },
  validationReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a geospatial index for location-based queries
complaintSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Complaint', complaintSchema);
