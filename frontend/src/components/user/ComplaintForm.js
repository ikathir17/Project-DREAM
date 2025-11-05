import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { complaintsAPI } from '../../services/api';
import Layout from '../common/Layout';
import './ComplaintForm.css';

// Add styles for the audio recording
const styles = `
  @keyframes pulse {
    0% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 0.5; transform: scale(1); }
  }
  
  .recording-indicator {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    color: #dc3545;
    font-weight: bold;
  }
  
  .pulse {
    width: 12px;
    height: 12px;
    background-color: #dc3545;
    border-radius: 50%;
    margin-right: 8px;
    animation: pulse 1.5s infinite;
  }
  
  .recording-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .audio-preview {
    margin-top: 10px;
  }
`;

// Add styles to the document
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Fix for Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Map click component
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const ComplaintForm = () => {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [recordingTimer, setRecordingTimer] = useState(null);

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      // Options for geolocation
      const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition([position.coords.latitude, position.coords.longitude]);
          toast.success('Location detected successfully');
        },
        (error) => {
          console.error('Error getting location:', error);
          
          // Provide specific error messages based on error code
          let errorMessage = '';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions in your browser settings and refresh the page, or select your location manually on the map.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please select your location manually on the map.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please select your location manually on the map.';
              break;
            default:
              errorMessage = 'An unknown error occurred while getting your location. Please select manually on the map.';
              break;
          }
          
          toast.warning(errorMessage, { autoClose: 5000 });
          // Set default position (can be a central location in your target area)
          setPosition([20.5937, 78.9629]); // Default to center of India
        },
        options
      );
    } else {
      toast.error('Geolocation is not supported by your browser. Please select your location manually on the map.');
      setPosition([20.5937, 78.9629]); // Default to center of India
    }
  }, []);

  // Help needed options
  const helpOptions = [
    { id: 'medical', label: 'Medical Assistance' },
    { id: 'rescue', label: 'Rescue' },
    { id: 'food', label: 'Food Supplies' },
    { id: 'shelter', label: 'Shelter' },
    { id: 'evacuation', label: 'Evacuation' },
    { id: 'other_help', label: 'Other Assistance' }
  ];

  // Validation schema
  const validationSchema = Yup.object().shape({
    type: Yup.string()
      .required('Type is required'),
    text: Yup.string()
      .required('Description is required')
      .min(10, 'Description must be at least 10 characters'),
    helpNeeded: Yup.array()
      .min(1, 'Please select at least one type of help needed'),
    image: Yup.mixed().nullable().optional(),
    audio: Yup.mixed().nullable().optional()
  });

  // Handle image change
  const handleImageChange = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (file) {
      setFieldValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Handle audio recording
  const startRecording = async (setFieldValue) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioFile = new File([audioBlob], `recording-${Date.now()}.wav`, { 
          type: 'audio/wav',
          lastModified: Date.now()
        });
        
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setAudioFile(audioFile.name);
        setFieldValue('audio', audioFile);
      };

      mediaRecorder.start(1000); // Collect data every second
      setMediaRecorder(mediaRecorder);
      setAudioChunks([]);
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      const timer = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      setRecordingTimer(timer);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      // Clear timer
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
    }
  };

  const clearAudio = (setFieldValue) => {
    setAudioFile(null);
    setAudioUrl('');
    setAudioBlob(null);
    setAudioChunks([]);
    setFieldValue('audio', null);
  };

  // Handle form submission
  const handleSubmit = async (values, { resetForm }) => {
    console.log('Form submitted with values:', values);
    console.log('Position:', position);
    
    // Check authentication
    const token = localStorage.getItem('token');
    console.log('Auth token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      toast.error('Please login first to submit a complaint');
      return;
    }
    
    if (!position) {
      toast.error('Please select your location on the map');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting form submission...');

      // Create FormData object for file uploads
      const formData = new FormData();
      formData.append('text', values.text);
      formData.append('type', values.type);
      
      // Add helpNeeded as a JSON string
      if (values.helpNeeded && values.helpNeeded.length > 0) {
        formData.append('helpNeeded', JSON.stringify(values.helpNeeded));
      }
      
      // Add location data
      formData.append('location', JSON.stringify({
        type: 'Point',
        coordinates: [position[1], position[0]] // [longitude, latitude]
      }));
      
      // Add files if present
      if (values.image) {
        formData.append('image', values.image);
      }
      
      if (values.audio) {
        formData.append('audio', values.audio);
      }

      console.log('Submitting form data:', {
        text: values.text,
        type: values.type,
        helpNeeded: values.helpNeeded,
        location: { coordinates: [position[1], position[0]] },
        hasImage: !!values.image,
        hasAudio: !!values.audio
      });

      // Submit complaint
      console.log('Calling API with FormData...');
      const response = await complaintsAPI.createComplaint(formData);
      console.log('API Response:', response);
      
      if (response.data.success) {
        console.log('Complaint submitted successfully');
        toast.success('Complaint submitted successfully');
        resetForm();
        setImagePreview(null);
        setAudioFile(null);
        setPosition(null); // Reset map position
      }
    } catch (error) {
      console.error('Form submission error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit complaint';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log('Form submission completed');
    }
  };

  return (
    <Layout title="Submit a Complaint">
      <div className="complaint-form-container">
        <div className="form-header">
          <h2 className="form-title">Report a Disaster Situation</h2>
          <p className="form-subtitle">Fill out the form below with details about the disaster situation you want to report.</p>
        </div>
          
          <Formik
            initialValues={{
              type: '',
              text: '',
              helpNeeded: [],
              image: null,
              audio: null
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            validate={(values) => {
              console.log('Form validation running with values:', values);
              const errors = {};
              
              // Check if position is set (location selected on map)
              if (!position) {
                errors.location = 'Location is required. Please allow location access or click on the map to select manually.';
                console.log('Validation error: Location not selected');
              }
              
              console.log('Validation errors:', errors);
              console.log('Form is valid:', Object.keys(errors).length === 0);
              console.log('Position exists:', !!position);
              console.log('Text length:', values.text.length);
              console.log('Help needed count:', values.helpNeeded.length);
              return errors;
            }}
          >
            {({ isSubmitting, setFieldValue, errors, isValid }) => {
              console.log('Formik state - isSubmitting:', isSubmitting, 'isValid:', isValid, 'errors:', errors);
              return (
              <Form>
                <div className="form-section">
                  <h3 className="section-title">
                    <i className="fas fa-info-circle"></i> Complaint Details
                  </h3>
                  
                  <div className="form-group">
                    <label htmlFor="type" className="form-label">
                      Type of Disaster *
                    </label>
                    <Field
                      as="select"
                      name="type"
                      id="type"
                      className="form-select"
                    >
                      <option value="">Select Type</option>
                      <option value="flood">Flood</option>
                      <option value="earthquake">Earthquake</option>
                      <option value="fire">Fire</option>
                      <option value="landslide">Landslide</option>
                      <option value="cyclone">Cyclone</option>
                      <option value="drought">Drought</option>
                      <option value="other">Other</option>
                    </Field>
                    <ErrorMessage name="type" component="div" className="form-error" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="text" className="form-label">
                      Description *
                    </label>
                    <Field
                      as="textarea"
                      name="text"
                      id="text"
                      rows={4}
                      className="form-control form-textarea"
                      placeholder="Describe the disaster situation in detail"
                    />
                    <ErrorMessage name="text" component="div" className="form-error" />
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">
                    <i className="fas fa-hands-helping"></i> Help Needed *
                  </h3>
                  <div className="form-group">
                    <div className="help-options">
                      {helpOptions.map(option => (
                        <label key={option.id} className="checkbox-label">
                          <Field 
                            type="checkbox" 
                            name="helpNeeded" 
                            value={option.id}
                            className="checkbox-input"
                          />
                          <span className="checkbox-custom"></span>
                          {option.label}
                        </label>
                      ))}
                    </div>
                    <ErrorMessage name="helpNeeded" component="div" className="form-error" />
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">
                    <i className="fas fa-map-marker-alt"></i> Location *
                  </h3>
                  <p className="map-help-text">
                    {position ? 
                      'Your current location is selected. Click on the map to change it if needed.' : 
                      'Getting your current location... Click on the map to select manually if needed.'
                    }
                  </p>
                  
                  <div className="map-container">
                    {position && (
                      <MapContainer 
                        center={position} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={position} setPosition={setPosition} />
                      </MapContainer>
                    )}
                  </div>
                  
                  {position && (
                    <div className="coordinates-display">
                      <i className="fas fa-map-marker-alt"></i> 
                      <strong>Selected Location:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}
                      <small style={{display: 'block', marginTop: '5px', color: '#666'}}>
                        (Click on map to change location)
                      </small>
                    </div>
                  )}
                  
                  {!position && (
                    <div className="form-error" style={{marginTop: '10px'}}>
                      <i className="fas fa-exclamation-triangle"></i> Unable to get your location. Please click on the map to select your location manually.
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <h3 className="section-title">
                    <i className="fas fa-paperclip"></i> Attachments (Optional)
                  </h3>
                  
                  <div className="form-row">
                    <div className="form-col">
                      <div className="form-group">
                        <label htmlFor="image" className="form-label">
                          Image
                        </label>
                        <div className="file-input-container">
                          <input
                            type="file"
                            id="image"
                            name="image"
                            className="file-input"
                            accept="image/*"
                            onChange={(event) => handleImageChange(event, setFieldValue)}
                          />
                          <label htmlFor="image" className="file-input-label">
                            <i className="fas fa-camera"></i> Choose Image
                          </label>
                        </div>
                        
                        {imagePreview && (
                          <div className="file-preview">
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="image-preview"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-col">
                      <div className="form-group">
                        <label className="form-label">
                          Audio Recording (Optional)
                        </label>
                        
                        {!isRecording ? (
                          <div className="audio-controls">
                            <button
                              type="button"
                              onClick={() => startRecording(setFieldValue)}
                              className="btn btn-primary"
                            >
                              🎤 Start Recording
                            </button>
                          </div>
                        ) : (
                          <div className="recording-controls">
                            <div className="recording-indicator">
                              <div className="pulse"></div>
                              <span>Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                            </div>
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="btn btn-danger"
                            >
                              ⬛ Stop Recording
                            </button>
                          </div>
                        )}
                        
                        {(audioUrl || audioFile) && (
                          <div className="audio-preview mt-2">
                            {audioUrl && (
                              <div className="d-flex align-items-center mt-2">
                                <audio controls src={audioUrl} className="me-2" />
                                <button
                                  type="button"
                                  onClick={() => clearAudio(setFieldValue)}
                                  className="btn btn-sm btn-outline-danger"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="submit-button"
                  onClick={() => console.log('Submit button clicked!')}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Complaint'
                  )}
                </button>
              </Form>
              );
            }}
          </Formik>
      </div>
    </Layout>
  );
};

export default ComplaintForm;
