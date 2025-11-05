const express = require('express');
const {
  createComplaint,
  getUserComplaints,
  getComplaint,
  updateComplaintStatus,
  getNearbyComplaints,
  getAdminComplaints,
  getAllComplaintsForReport,
  getUrgentComplaints,
  getComplaintStats,
  verifyComplaint,
  getManualVerificationComplaints,
  manualVerifyComplaint,
  reVerifyComplaint,
  overrideAIRejection,
  overrideSpamClassification
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images and audio only
  if (file.fieldname === 'image') {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  } else if (file.fieldname === 'audio') {
    if (file.mimetype.startsWith('audio')) {
      cb(null, true);
    } else {
      cb(new Error('Not an audio file! Please upload only audio files.'), false);
    }
  } else {
    cb(new Error('Invalid field name!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max size
});

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

router.route('/')
  .post(protect, uploadFields, createComplaint)
  .get(protect, getUserComplaints);

router.get('/nearby', protect, getNearbyComplaints);
router.get('/admin/all', protect, authorize('admin'), getAllComplaintsForReport);
router.get('/admin', protect, authorize('admin'), getAdminComplaints);
router.get('/urgent', protect, authorize('admin'), getUrgentComplaints);
router.get('/stats', protect, authorize('admin'), getComplaintStats);
router.get('/manual-verification', protect, authorize('admin'), getManualVerificationComplaints);

router.route('/:id')
  .get(protect, getComplaint)
  .put(protect, updateComplaintStatus);

router.put('/:id/verify', protect, authorize('admin'), verifyComplaint);
router.put('/:id/manual-verify', protect, authorize('admin'), manualVerifyComplaint);
router.put('/:id/re-verify', protect, authorize('admin'), reVerifyComplaint);
router.put('/:id/override-ai', protect, authorize('admin'), overrideAIRejection);
router.put('/:id/override-spam', protect, authorize('admin'), overrideSpamClassification);

module.exports = router;
