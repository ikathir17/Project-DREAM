import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import './MediaModal.css';

const MediaModal = ({ isOpen, onClose, complaintId, mediaType, complaintData }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState({});
  const [audioUrl, setAudioUrl] = useState(null);

  // Fetch images metadata
  const fetchImages = async () => {
    try {
      setLoading(true);
      setError('');
      
      const authToken = token || localStorage.getItem('token');
      const response = await apiService.getNearbyComplaintImages(authToken, complaintId);
      
      if (response.success) {
        setImages(response.data.images);
      } else {
        setError('Failed to load images');
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific image
  const fetchImage = async (imageIndex) => {
    try {
      const authToken = token || localStorage.getItem('token');
      const blob = await apiService.getNearbyComplaintImage(authToken, complaintId, imageIndex);
      const url = URL.createObjectURL(blob);
      
      setImageUrls(prev => ({
        ...prev,
        [imageIndex]: url
      }));
    } catch (err) {
      console.error('Error fetching image:', err);
      setError(`Failed to load image ${imageIndex + 1}`);
    }
  };

  // Fetch audio
  const fetchAudio = async () => {
    try {
      setLoading(true);
      setError('');
      
      const authToken = token || localStorage.getItem('token');
      const blob = await apiService.getNearbyComplaintAudio(authToken, complaintId);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err) {
      console.error('Error fetching audio:', err);
      setError(err.message || 'Failed to load audio');
    } finally {
      setLoading(false);
    }
  };

  // Handle image navigation
  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      if (!imageUrls[newIndex]) {
        fetchImage(newIndex);
      }
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      if (!imageUrls[newIndex]) {
        fetchImage(newIndex);
      }
    }
  };

  // Load media when modal opens
  useEffect(() => {
    if (isOpen && complaintId) {
      if (mediaType === 'images') {
        fetchImages();
      } else if (mediaType === 'audio') {
        fetchAudio();
      }
    }
  }, [isOpen, complaintId, mediaType]);

  // Load first image when images are fetched
  useEffect(() => {
    if (images.length > 0 && !imageUrls[0]) {
      fetchImage(0);
    }
  }, [images]);

  // Cleanup URLs when modal closes
  useEffect(() => {
    return () => {
      // Cleanup object URLs to prevent memory leaks
      Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url));
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (mediaType === 'images') {
        if (e.key === 'ArrowLeft') {
          prevImage();
        } else if (e.key === 'ArrowRight') {
          nextImage();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, mediaType, currentImageIndex, images.length]);

  if (!isOpen) return null;

  return (
    <div className="media-modal-overlay" onClick={onClose}>
      <div className="media-modal" onClick={(e) => e.stopPropagation()}>
        <div className="media-modal-header">
          <div className="modal-title">
            <h3>
              {mediaType === 'images' ? '📷 Images' : '🎵 Audio Recording'}
            </h3>
            <div className="complaint-info">
              <span className="disaster-type">
                {complaintData?.disasterType?.charAt(0).toUpperCase() + complaintData?.disasterType?.slice(1)}
              </span>
              <span className="distance">📍 {complaintData?.distanceKm}km away</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="media-modal-content">
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading {mediaType}...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              <span>{error}</span>
            </div>
          )}

          {mediaType === 'images' && images.length > 0 && !loading && (
            <div className="image-viewer">
              <div className="image-container">
                {imageUrls[currentImageIndex] ? (
                  <img
                    src={imageUrls[currentImageIndex]}
                    alt={images[currentImageIndex]?.filename}
                    className="modal-image"
                  />
                ) : (
                  <div className="image-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading image...</p>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="image-navigation">
                  <button
                    className="nav-btn prev-btn"
                    onClick={prevImage}
                    disabled={currentImageIndex === 0}
                  >
                    ← Previous
                  </button>
                  
                  <div className="image-counter">
                    {currentImageIndex + 1} of {images.length}
                  </div>
                  
                  <button
                    className="nav-btn next-btn"
                    onClick={nextImage}
                    disabled={currentImageIndex === images.length - 1}
                  >
                    Next →
                  </button>
                </div>
              )}

              <div className="image-info">
                <p><strong>Filename:</strong> {images[currentImageIndex]?.filename}</p>
                <p><strong>Size:</strong> {Math.round(images[currentImageIndex]?.size / 1024)}KB</p>
                {images[currentImageIndex]?.description && (
                  <p><strong>Description:</strong> {images[currentImageIndex].description}</p>
                )}
              </div>
            </div>
          )}

          {mediaType === 'audio' && audioUrl && !loading && (
            <div className="audio-player">
              <div className="audio-container">
                <audio controls className="audio-element">
                  <source src={audioUrl} type="audio/webm" />
                  <source src={audioUrl} type="audio/mp4" />
                  Your browser does not support the audio element.
                </audio>
              </div>
              
              <div className="audio-info">
                <p>🎵 Audio recording from the complaint submitter</p>
                <p className="audio-tip">
                  💡 Use the audio controls to play, pause, and adjust volume
                </p>
              </div>
            </div>
          )}

          {mediaType === 'images' && images.length === 0 && !loading && !error && (
            <div className="no-media">
              <div className="no-media-icon">📷</div>
              <p>No images available for this complaint</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaModal;
