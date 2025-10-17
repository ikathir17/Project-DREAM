import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LocationMap from '../components/LocationMap';
import AudioRecorder from '../components/AudioRecorder';
import ImageUpload from '../components/ImageUpload';
import api from '../services/api';
import '../components/LocationMap.css';
import '../components/AudioRecorder.css';
import '../components/ImageUpload.css';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    disasterType: '',
    urgencyLevel: '',
    location: '',
    coordinates: null,
    description: '',
    contactNumber: user?.mobileNumber || '',
    affectedPeople: '',
    resourcesNeeded: [],
    customHelp: '',
    audioRecording: null,
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const disasterTypes = [
    { value: 'flood', label: 'Flood' },
    { value: 'earthquake', label: 'Earthquake' },
    { value: 'fire', label: 'Fire' },
    { value: 'cyclone', label: 'Cyclone/Hurricane' },
    { value: 'landslide', label: 'Landslide' },
    { value: 'drought', label: 'Drought' },
    { value: 'accident', label: 'Accident' },
    { value: 'medical', label: 'Medical Emergency' },
    { value: 'other', label: 'Other Emergency' }
  ];

  const urgencyLevels = [
    { value: 'critical', label: 'Critical - Immediate Response Required', color: '#dc2626' },
    { value: 'high', label: 'High - Response within 1 hour', color: '#ea580c' },
    { value: 'medium', label: 'Medium - Response within 6 hours', color: '#d97706' },
    { value: 'low', label: 'Low - Response within 24 hours', color: '#65a30d' }
  ];

  const helpTypes = [
    { value: 'medical', label: 'Medical Aid' },
    { value: 'rescue', label: 'Rescue Operations' },
    { value: 'food', label: 'Food & Water' },
    { value: 'shelter', label: 'Temporary Shelter' },
    { value: 'clothing', label: 'Clothing & Blankets' },
    { value: 'transport', label: 'Transportation' },
    { value: 'communication', label: 'Communication Equipment' },
    { value: 'power', label: 'Power/Electricity' },
    { value: 'cleanup', label: 'Cleanup Equipment' },
    { value: 'security', label: 'Security/Safety' },
    { value: 'psychological', label: 'Psychological Support' },
    { value: 'financial', label: 'Financial Assistance' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      location: locationData.address,
      coordinates: {
        lat: locationData.lat,
        lng: locationData.lng
      }
    }));
  };

  const handleHelpTypeChange = (helpValue) => {
    setFormData(prev => ({
      ...prev,
      resourcesNeeded: prev.resourcesNeeded.includes(helpValue)
        ? prev.resourcesNeeded.filter(item => item !== helpValue)
        : [...prev.resourcesNeeded, helpValue]
    }));
  };

  const handleAudioRecorded = (audioData) => {
    setFormData(prev => ({
      ...prev,
      audioRecording: audioData
    }));
  };

  const handleImagesChange = (images) => {
    setFormData(prev => ({
      ...prev,
      images: images
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    // Validate that at least one help type is selected
    if (formData.resourcesNeeded.length === 0) {
      setSubmitMessage('Please select at least one type of help needed.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        setSubmitMessage('Authentication required. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      // Prepare complaint data for backend
      const complaintData = {
        disasterType: formData.disasterType,
        urgencyLevel: formData.urgencyLevel,
        location: formData.location,
        coordinates: formData.coordinates,
        description: formData.description,
        contactNumber: formData.contactNumber,
        affectedPeople: formData.affectedPeople,
        resourcesNeeded: formData.resourcesNeeded,
        customHelp: formData.customHelp,
        audioRecording: formData.audioRecording?.base64 || null,
        images: formData.images || []
      };

      // Debug logging
      console.log('📤 Sending complaint data:', complaintData);
      console.log('📤 Data type:', typeof complaintData);
      console.log('📤 Data keys:', Object.keys(complaintData));

      // Submit complaint to backend
      const response = await api.submitComplaint(token, complaintData);
      
      if (response.success) {
        console.log('✅ Complaint submitted successfully:', response.data);
        
        const audioInfo = formData.audioRecording ? 
          `\nAudio recording included (${Math.round(formData.audioRecording.size / 1024)}KB)` : '';
        
        const imageInfo = formData.images.length > 0 ? 
          `\n${formData.images.length} image(s) attached` : '';
        
        setSubmitMessage(`Your complaint has been submitted successfully! 
        Complaint ID: ${response.data.complaintId}
        Priority: ${response.data.priority}${audioInfo}${imageInfo}
        ${response.data.estimatedResponse?.description || 'Emergency response team will contact you soon.'}`);
      } else {
        throw new Error(response.message || 'Failed to submit complaint');
      }
      
      // Reset form
      setFormData({
        disasterType: '',
        urgencyLevel: '',
        location: '',
        coordinates: null,
        description: '',
        contactNumber: user?.mobileNumber || '',
        affectedPeople: '',
        resourcesNeeded: [],
        customHelp: '',
        audioRecording: null,
        images: []
      });
    } catch (error) {
      console.error('Complaint submission error:', error);
      setSubmitMessage(`Failed to submit complaint: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="home-page">
      <div className="complaint-header">
        <h2>Disaster Emergency Report Form</h2>
        <p>Report disasters and emergencies for immediate response</p>
        <div className="user-info">
          <span>Reporting as: <strong>{user?.name}</strong></span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="complaint-form">
        <div className="form-section">
          <h3>Disaster Information</h3>
          
          <div className="form-group">
            <label htmlFor="disasterType">Type of Disaster/Emergency *</label>
            <select
              id="disasterType"
              name="disasterType"
              value={formData.disasterType}
              onChange={handleInputChange}
              required
              className="form-select"
            >
              <option value="">Select disaster type...</option>
              {disasterTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="urgencyLevel">Urgency Level *</label>
            <select
              id="urgencyLevel"
              name="urgencyLevel"
              value={formData.urgencyLevel}
              onChange={handleInputChange}
              required
              className="form-select urgency-select"
            >
              <option value="">Select urgency level...</option>
              {urgencyLevels.map(level => (
                <option key={level.value} value={level.value} style={{ color: level.color }}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Location & Contact</h3>
          
          <div className="form-group">
            <label>Exact Location/Address *</label>
            <LocationMap 
              onLocationSelect={handleLocationSelect}
              initialLocation={formData.coordinates ? [formData.coordinates.lat, formData.coordinates.lng] : null}
            />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Address will be filled automatically when you select location on map"
              required
              className="form-input location-display"
              readOnly
            />
            <small className="location-help">
              Click on the map above to select the exact emergency location
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="contactNumber">Emergency Contact Number *</label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              placeholder="Emergency contact number"
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Details</h3>
          
          <div className="form-group">
            <label htmlFor="description">Detailed Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the situation in detail - what happened, current status, immediate dangers..."
              required
              rows="4"
              className="form-textarea"
            />
          </div>

          <AudioRecorder 
            onAudioRecorded={handleAudioRecorded}
            disabled={isSubmitting}
          />

          <ImageUpload 
            onImagesChange={handleImagesChange}
            disabled={isSubmitting}
            maxImages={5}
          />

          <div className="form-group">
            <label htmlFor="affectedPeople">Number of People Affected</label>
            <input
              type="number"
              id="affectedPeople"
              name="affectedPeople"
              value={formData.affectedPeople}
              onChange={handleInputChange}
              placeholder="Approximate count"
              min="0"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Type of Help/Resources Needed *</label>
            {formData.resourcesNeeded.length > 0 && (
              <div className="selected-help-count">
                {formData.resourcesNeeded.length} type{formData.resourcesNeeded.length > 1 ? 's' : ''} of help selected
              </div>
            )}
            <div className="help-types-grid">
              {helpTypes.map(help => (
                <div
                  key={help.value}
                  className={`help-type-card ${formData.resourcesNeeded.includes(help.value) ? 'selected' : ''}`}
                  onClick={() => handleHelpTypeChange(help.value)}
                >
                  <span className="help-label">{help.label}</span>
                </div>
              ))}
            </div>
            <small className="help-instruction">
              Click on the cards above to select multiple types of help needed
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="customHelp">Additional Help Needed (Optional)</label>
            <input
              type="text"
              id="customHelp"
              name="customHelp"
              value={formData.customHelp}
              onChange={handleInputChange}
              placeholder="Specify any other help not listed above..."
              className="form-input"
            />
          </div>
        </div>

        {submitMessage && (
          <div className={`submit-message ${submitMessage.includes('successfully') ? 'success' : 'error'}`}>
            {submitMessage}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              'Submit Emergency Report'
            )}
          </button>
        </div>

        <div className="emergency-note">
          <p><strong>For life-threatening emergencies, call emergency services immediately!</strong></p>
          <p>This form is for reporting disasters and coordinating relief efforts.</p>
        </div>
      </form>
    </div>
  );
};

export default Home;
