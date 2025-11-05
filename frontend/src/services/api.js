import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  sendOTP: (mobileNumber) => api.post('/auth/send-otp', { mobileNumber }),
  verifyOTP: (mobileNumber, otp) => api.post('/auth/verify-otp', { mobileNumber, otp }),
  getCurrentUser: () => api.get('/auth/me')
};

// Complaints API
export const complaintsAPI = {
  // Create a new complaint with formData for file uploads
  createComplaint: (formData) => {
    return api.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Get all complaints for the current user
  getUserComplaints: () => api.get('/complaints'),
  
  // Get a single complaint by ID
  getComplaint: (id) => api.get(`/complaints/${id}`),
  
  // Update complaint status
  updateComplaintStatus: (id, status) => api.put(`/complaints/${id}`, { status }),
  
  // Get nearby verified complaints
  getNearbyComplaints: (longitude, latitude, maxDistance) => 
    api.get(`/complaints/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=${maxDistance || 5000}`),
  
  // Admin: Get all non-spam complaints
  getAdminComplaints: () => api.get('/complaints/admin'),
  
  // Admin: Get ALL complaints (including spam, verified, unverified) for reports
  getAllComplaints: () => api.get('/complaints/admin/all'),
  
  // Admin: Get urgent complaints
  getUrgentComplaints: () => api.get('/complaints/urgent'),
  
  // Admin: Get complaint statistics
  getComplaintStats: () => api.get('/complaints/stats'),
  
  // Admin: Verify a complaint
  verifyComplaint: (id) => api.put(`/complaints/${id}/verify`),
  
  // Admin: Get complaints requiring manual verification
  getManualVerificationComplaints: () => api.get('/complaints/manual-verification'),
  
  // Admin: Manually verify a complaint
  manualVerifyComplaint: (id, verified, reason) => 
    api.put(`/complaints/${id}/manual-verify`, { verified, reason }),
  
  // Admin: Re-verify a rejected complaint
  reVerifyComplaint: (id, verified, reason) => 
    api.put(`/complaints/${id}/re-verify`, { verified, reason }),
  
  // Admin: Override AI rejection decision
  overrideAIRejection: (id, verified, reason) => 
    api.put(`/complaints/${id}/override-ai`, { verified, reason }),
  
  // Admin: Override spam classification
  overrideSpamClassification: (id, isSpam, reason) => 
    api.put(`/complaints/${id}/override-spam`, { isSpam, reason })
};

export default api;
