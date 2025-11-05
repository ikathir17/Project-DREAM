import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  Filter, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Layers,
  Search,
  Target,
  Info
} from 'lucide-react';
import { complaintsAPI } from '../../services/api';
import Layout from '../common/Layout';
import LoadingSkeleton from '../common/LoadingSkeleton';
import './NearbyComplaints.css';

// Fix for Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const NearbyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState([20.5937, 78.9629]); // Default to center of India
  const [maxDistance, setMaxDistance] = useState(5000); // 5km default
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [mapView, setMapView] = useState('hybrid'); // 'map', 'list', 'hybrid'

  // Fetch nearby complaints on component mount
  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPosition = [position.coords.latitude, position.coords.longitude];
          setPosition(userPosition);
          fetchNearbyComplaints(position.coords.longitude, position.coords.latitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get your current location. Using default location.');
          fetchNearbyComplaints(78.9629, 20.5937); // Default coordinates
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      fetchNearbyComplaints(78.9629, 20.5937); // Default coordinates
    }
  }, []);

  // Filter complaints based on status and type
  useEffect(() => {
    let filtered = complaints;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }
    
    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.type === typeFilter);
    }
    
    setFilteredComplaints(filtered);
  }, [complaints, statusFilter, typeFilter]);

  // Fetch nearby complaints
  const fetchNearbyComplaints = async (longitude, latitude) => {
    try {
      setLoading(true);
      const response = await complaintsAPI.getNearbyComplaints(longitude, latitude, maxDistance);
      
      if (response.data.success) {
        setComplaints(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch nearby complaints');
    } finally {
      setLoading(false);
    }
  };

  // Handle distance change and refetch
  const handleDistanceChange = (e) => {
    const newDistance = parseInt(e.target.value);
    setMaxDistance(newDistance);
    
    // Refetch with new distance
    fetchNearbyComplaints(position[1], position[0], newDistance);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status configuration
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          color: 'warning',
          icon: Clock,
          label: 'Pending',
          bgColor: 'var(--warning)',
          textColor: '#7c2d12'
        };
      case 'in_progress':
        return {
          color: 'info',
          icon: AlertTriangle,
          label: 'In Progress',
          bgColor: 'var(--info)',
          textColor: '#0c4a6e'
        };
      case 'resolved':
        return {
          color: 'success',
          icon: CheckCircle,
          label: 'Resolved',
          bgColor: 'var(--success)',
          textColor: '#064e3b'
        };
      default:
        return {
          color: 'gray',
          icon: Info,
          label: 'Unknown',
          bgColor: 'var(--gray-400)',
          textColor: 'var(--gray-700)'
        };
    }
  };

  // Get complaint type icon
  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'flood':
        return '🌊';
      case 'earthquake':
        return '🏚️';
      case 'fire':
        return '🔥';
      case 'landslide':
        return '⛰️';
      case 'cyclone':
        return '🌪️';
      case 'drought':
        return '🏜️';
      default:
        return '⚠️';
    }
  };

  // Get unique complaint types for filter
  const getComplaintTypes = () => {
    const types = [...new Set(complaints.map(c => c.type))];
    return types;
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in kilometers
    return Math.round(d * 100) / 100; // Round to 2 decimal places
  };

  // Get stats
  const getStats = () => {
    const total = filteredComplaints.length;
    const pending = filteredComplaints.filter(c => c.status === 'pending').length;
    const inProgress = filteredComplaints.filter(c => c.status === 'in_progress').length;
    const resolved = filteredComplaints.filter(c => c.status === 'resolved').length;
    
    return { total, pending, inProgress, resolved };
  };

  const stats = getStats();
  const complaintTypes = getComplaintTypes();

  return (
    <Layout title="Nearby Complaints">
      <div className="nearby-complaints-page">
        {/* Stats Cards */}
        <motion.div 
          className="stats-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="stat-card total">
            <div className="stat-icon">
              <MapPin size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Nearby Complaints</div>
            </div>
          </div>
          
          <div className="stat-card pending">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          
          <div className="stat-card progress">
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.inProgress}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>
          
          <div className="stat-card resolved">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.resolved}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>
        </motion.div>

        {/* Controls Section */}
        <motion.div 
          className="controls-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="distance-control">
            <Target size={18} />
            <label htmlFor="distance">Search Radius:</label>
            <select
              id="distance"
              value={maxDistance}
              onChange={handleDistanceChange}
              className="distance-select"
            >
              <option value="1000">1 km</option>
              <option value="2000">2 km</option>
              <option value="5000">5 km</option>
              <option value="10000">10 km</option>
              <option value="20000">20 km</option>
            </select>
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <Filter size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="filter-group">
              <Layers size={18} />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                {complaintTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="view-toggle">
              <motion.button
                className={`view-btn ${mapView === 'hybrid' ? 'active' : ''}`}
                onClick={() => setMapView('hybrid')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Layers size={16} />
                Both
              </motion.button>
              <motion.button
                className={`view-btn ${mapView === 'map' ? 'active' : ''}`}
                onClick={() => setMapView('map')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MapPin size={16} />
                Map
              </motion.button>
              <motion.button
                className={`view-btn ${mapView === 'list' ? 'active' : ''}`}
                onClick={() => setMapView('list')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Search size={16} />
                List
              </motion.button>
            </div>

            <motion.button
              className="refresh-btn"
              onClick={() => fetchNearbyComplaints(position[1], position[0])}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={18} className={loading ? 'spinning' : ''} />
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="main-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {loading ? (
            <LoadingSkeleton variant="card" count={2} />
          ) : (
            <div className={`content-layout ${mapView}`}>
              {/* Map Section */}
              {(mapView === 'map' || mapView === 'hybrid') && (
                <motion.div 
                  className="map-section"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="map-header">
                    <h3>
                      <Navigation size={20} />
                      Interactive Map
                    </h3>
                    <span className="location-info">
                      <MapPin size={16} />
                      {filteredComplaints.length} complaints within {maxDistance/1000}km
                    </span>
                  </div>
                  <div className="map-container">
                    <MapContainer 
                      center={position} 
                      zoom={12} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      {/* User position marker */}
                      <Marker position={position}>
                        <Popup>
                          <div className="popup-content">
                            <strong>📍 Your Location</strong>
                          </div>
                        </Popup>
                      </Marker>
                      
                      {/* Complaint markers */}
                      {filteredComplaints.map(complaint => {
                        const coords = complaint.location.coordinates;
                        const distance = calculateDistance(
                          position[0], position[1], 
                          coords[1], coords[0]
                        );
                        const statusConfig = getStatusConfig(complaint.status);
                        
                        return (
                          <Marker 
                            key={complaint._id} 
                            position={[coords[1], coords[0]]}
                            icon={new L.Icon({
                              iconUrl: statusConfig.color === 'success' 
                                ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
                                : statusConfig.color === 'info'
                                ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
                                : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
                              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                              iconSize: [25, 41],
                              iconAnchor: [12, 41],
                              popupAnchor: [1, -34],
                              shadowSize: [41, 41]
                            })}
                          >
                            <Popup>
                              <div className="popup-content">
                                <div className="popup-header">
                                  <span className="popup-emoji">{getTypeIcon(complaint.type)}</span>
                                  <strong>{complaint.type}</strong>
                                </div>
                                <p className="popup-description">
                                  {complaint.text.substring(0, 100)}...
                                </p>
                                <div className="popup-meta">
                                  <span className="popup-distance">📏 {distance} km away</span>
                                  <span className="popup-date">📅 {formatDate(complaint.createdAt)}</span>
                                </div>
                                <div className="popup-status" style={{ 
                                  backgroundColor: statusConfig.bgColor, 
                                  color: statusConfig.textColor 
                                }}>
                                  {statusConfig.label}
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  </div>
                </motion.div>
              )}

              {/* List Section */}
              {(mapView === 'list' || mapView === 'hybrid') && (
                <motion.div 
                  className="list-section"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="list-header">
                    <h3>
                      <Search size={20} />
                      Complaints List
                    </h3>
                    <span className="count-info">{filteredComplaints.length} results</span>
                  </div>

                  <div className="complaints-list">
                    {filteredComplaints.length === 0 ? (
                      <motion.div 
                        className="empty-state"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <MapPin size={64} className="empty-icon" />
                        <h3>No Complaints Found</h3>
                        <p>No verified complaints found in your selected area and filters.</p>
                      </motion.div>
                    ) : (
                      <AnimatePresence>
                        {filteredComplaints.map((complaint, index) => {
                          const statusConfig = getStatusConfig(complaint.status);
                          const StatusIcon = statusConfig.icon;
                          const distance = calculateDistance(
                            position[0], position[1], 
                            complaint.location.coordinates[1], 
                            complaint.location.coordinates[0]
                          );
                          
                          return (
                            <motion.div
                              key={complaint._id}
                              className="complaint-item"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1, duration: 0.5 }}
                              whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)" }}
                            >
                              <div className="complaint-header">
                                <div className="complaint-type">
                                  <span className="type-emoji">{getTypeIcon(complaint.type)}</span>
                                  <span className="type-text">{complaint.type}</span>
                                </div>
                                <div className="complaint-distance">
                                  <Navigation size={14} />
                                  {distance} km
                                </div>
                              </div>
                              
                              <div className="complaint-content">
                                <p className="complaint-description">{complaint.text}</p>
                              </div>
                              
                              <div className="complaint-meta">
                                <div className="meta-item">
                                  <Calendar size={14} />
                                  <span>{formatDate(complaint.createdAt)}</span>
                                </div>
                                <div className="meta-item verified">
                                  <CheckCircle size={14} />
                                  <span>Verified</span>
                                </div>
                              </div>
                              
                              <div className="complaint-footer">
                                <div className="status-badge" style={{ 
                                  backgroundColor: statusConfig.bgColor, 
                                  color: statusConfig.textColor 
                                }}>
                                  <StatusIcon size={14} />
                                  {statusConfig.label}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default NearbyComplaints;
