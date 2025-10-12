const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    console.log('🔗 Final request config:', config);
    console.log('🔗 Final headers:', config.headers);

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async sendOTP(mobileNumber) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber }),
    });
  }

  async verifyOTP(mobileNumber, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber, otp }),
    });
  }

  async getProfile(token) {
    return this.request('/auth/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async updateProfile(token, profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Complaint methods
  async submitComplaint(token, complaintData) {
    console.log('🔗 API Service - Submitting complaint');
    console.log('🔗 Token:', token ? 'Present' : 'Missing');
    console.log('🔗 Data:', complaintData);
    console.log('🔗 Stringified data:', JSON.stringify(complaintData));
    
    return this.request('/complaints/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(complaintData),
    });
  }

  async getMyComplaints(token, page = 1, limit = 10) {
    return this.request(`/complaints/my-complaints?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getComplaintDetails(token, complaintId) {
    return this.request(`/complaints/${complaintId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async updateComplaint(token, complaintId, updateData) {
    return this.request(`/complaints/${complaintId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
  }

  async getComplaintStats(token) {
    return this.request('/complaints/stats/summary', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getComplaintAudio(token, complaintId) {
    const response = await fetch(`${this.baseURL}/complaints/${complaintId}/audio`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audio recording');
    }

    return response.blob();
  }

  // Geocoding methods
  async reverseGeocode(lat, lon) {
    return this.request(`/geocode/reverse?lat=${lat}&lon=${lon}`, {
      method: 'GET',
    });
  }

  // Test methods
  async testPost(data) {
    console.log('🧪 Testing POST with data:', data);
    return this.request('/test-post', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export default new ApiService();
