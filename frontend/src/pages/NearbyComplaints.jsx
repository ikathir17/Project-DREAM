import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import './NearbyComplaints.css';

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

const NearbyComplaints = () => {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [locationError, setLocationError] = useState('');
  const [searchCenter, setSearchCenter] = useState(null);

  // Get user's current location
  const getCurrentLocation = () => {
    setLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        fetchNearbyComplaints(location.lat, location.lng);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services and refresh the page.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Fetch nearby complaints
  const fetchNearbyComplaints = async (lat, lng, page = 1) => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Fetching nearby complaints with token:', token ? 'Present' : 'Missing');
      console.log('🔍 Token value:', token);
      console.log('🔍 LocalStorage token:', localStorage.getItem('token'));

      // Fallback to localStorage if token not in context
      const authToken = token || localStorage.getItem('token');
      
      if (!authToken) {
        setError('Authentication token not available. Please try logging out and logging back in.');
        setLoading(false);
        return;
      }

      // Check if token is expired
      if (isTokenExpired(authToken)) {
        setError('Your session has expired. Please log out and log back in.');
        setLoading(false);
        return;
      }

      const response = await apiService.getNearbyComplaints(authToken, lat, lng, page, pagination.limit);
      
      if (response.success) {
        setComplaints(response.data.complaints);
        setPagination(response.data.pagination);
        setSearchCenter(response.data.searchCenter);
      } else {
        setError(response.message || 'Failed to fetch nearby complaints');
      }
    } catch (err) {
      console.error('Error fetching nearby complaints:', err);
      setError(err.message || 'Failed to fetch nearby complaints');
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    const authToken = token || localStorage.getItem('token');
    if (userLocation && authToken && newPage >= 1 && newPage <= pagination.pages) {
      fetchNearbyComplaints(userLocation.lat, userLocation.lng, newPage);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#d97706',
      low: '#65a30d'
    };
    return colors[urgency] || '#6b7280';
  };

  // Get disaster type icon
  const getDisasterIcon = (type) => {
    const icons = {
      flood: '🌊',
      earthquake: '🌍',
      fire: '🔥',
      cyclone: '🌪️',
      landslide: '⛰️',
      drought: '🏜️',
      accident: '🚨',
      medical: '🏥',
      other: '⚠️'
    };
    return icons[type] || '⚠️';
  };

  // Initial load
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <div className="nearby-complaints">
      <div className="page-header">
        <h2>Nearby Complaints</h2>
        <p className="page-description">
          Disaster reports within 5km of your location
        </p>
      </div>

      {/* Location Status */}
      <div className="location-status">
        {userLocation ? (
          <div className="location-info">
            <span className="location-icon">📍</span>
            <span>Showing complaints within 5km of your location</span>
            <button 
              className="refresh-location-btn"
              onClick={getCurrentLocation}
              disabled={loading}
            >
              🔄 Refresh Location
            </button>
          </div>
        ) : (
          <div className="location-prompt">
            <span className="location-icon">📍</span>
            <span>Getting your location...</span>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {locationError && (
        <div className="error-message location-error">
          <span className="error-icon">⚠️</span>
          <div>
            <strong>Location Error:</strong>
            <p>{locationError}</p>
            <button onClick={getCurrentLocation} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      )}

      {error && !locationError && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading nearby complaints...</p>
        </div>
      )}

      {/* Complaints List */}
      {!loading && !locationError && complaints.length > 0 && (
        <>
          <div className="complaints-summary">
            <p>Found {pagination.total} complaint{pagination.total !== 1 ? 's' : ''} within 5km</p>
          </div>

          <div className="complaints-grid">
            {complaints.map((complaint) => (
              <div key={complaint._id} className="complaint-card">
                <div className="complaint-header">
                  <div className="disaster-info">
                    <span className="disaster-icon">
                      {getDisasterIcon(complaint.disasterType)}
                    </span>
                    <div>
                      <h3 className="disaster-type">
                        {complaint.disasterType.charAt(0).toUpperCase() + complaint.disasterType.slice(1)}
                      </h3>
                      <div className="complaint-meta">
                        <span 
                          className="urgency-badge"
                          style={{ backgroundColor: getUrgencyColor(complaint.urgencyLevel) }}
                        >
                          {complaint.urgencyLevel.toUpperCase()}
                        </span>
                        <span className="distance">📍 {complaint.distanceKm}km away</span>
                      </div>
                    </div>
                  </div>
                  <div className="complaint-status">
                    <span className={`status-badge status-${complaint.status}`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="complaint-content">
                  <div className="location">
                    <strong>📍 Location:</strong> {complaint.location.address}
                  </div>
                  
                  <div className="description">
                    <strong>Description:</strong>
                    <p>{complaint.description}</p>
                  </div>

                  {complaint.affectedPeople > 0 && (
                    <div className="affected-people">
                      <strong>👥 Affected People:</strong> {complaint.affectedPeople}
                    </div>
                  )}

                  {complaint.resourcesNeeded && complaint.resourcesNeeded.length > 0 && (
                    <div className="resources-needed">
                      <strong>🆘 Help Needed:</strong>
                      <div className="resources-tags">
                        {complaint.resourcesNeeded.map((resource, index) => (
                          <span key={index} className="resource-tag">
                            {resource}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {complaint.customHelp && (
                    <div className="custom-help">
                      <strong>Additional Help:</strong>
                      <p>{complaint.customHelp}</p>
                    </div>
                  )}
                </div>

                <div className="complaint-footer">
                  <div className="submitter-info">
                    <span>👤 {complaint.submitterName}</span>
                    <span>📞 {complaint.contactNumber}</span>
                  </div>
                  <div className="complaint-time">
                    <span>🕒 {formatDate(complaint.createdAt)}</span>
                  </div>
                  {(complaint.images > 0 || complaint.hasAudio) && (
                    <div className="media-indicators">
                      {complaint.images > 0 && (
                        <span className="media-badge">📷 {complaint.images}</span>
                      )}
                      {complaint.hasAudio && (
                        <span className="media-badge">🎵 Audio</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              
              <div className="pagination-info">
                Page {pagination.page} of {pagination.pages}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* No Complaints Found */}
      {!loading && !locationError && userLocation && complaints.length === 0 && (
        <div className="no-complaints">
          <div className="no-complaints-icon">🎯</div>
          <h3>No Nearby Complaints</h3>
          <p>There are no active disaster reports within 5km of your location.</p>
          <button onClick={getCurrentLocation} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default NearbyComplaints;
