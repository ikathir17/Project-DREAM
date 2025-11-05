import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  Zap, 
  Eye, 
  Activity, 
  Calendar, 
  MapPin, 
  Image, 
  Mic, 
  RefreshCw,
  Bell,
  X,
  Shield,
  Users,
  Timer,
  Flame,
  TrendingUp,
  Filter
} from 'lucide-react';
import { complaintsAPI } from '../../services/api';
import Layout from '../common/Layout';
import LoadingSkeleton from '../common/LoadingSkeleton';
import './UrgentComplaints.css';

const UrgentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('urgency'); // 'urgency', 'time', 'type'
  const [filterType, setFilterType] = useState('all'); // 'all', 'flood', 'earthquake', etc.
  const [filterUrgency, setFilterUrgency] = useState('all'); // 'all', 'critical', 'high', 'medium', 'low'

  // Fetch urgent complaints on component mount
  useEffect(() => {
    fetchUrgentComplaints();
  }, []);

  // Fetch urgent complaints
  const fetchUrgentComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintsAPI.getUrgentComplaints();
      
      if (response.data.success) {
        setComplaints(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch urgent complaints');
    } finally {
      setLoading(false);
    }
  };

  // Refresh urgent complaints
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchUrgentComplaints();
      toast.success('Urgent complaints refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh urgent complaints');
    } finally {
      setRefreshing(false);
    }
  };

  // Update complaint status
  const updateStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      const response = await complaintsAPI.updateComplaintStatus(id, status);
      
      if (response.data.success) {
        // Update local state by removing the complaint from the list
        // since it's now in progress and no longer urgent
        if (status === 'in_progress') {
          setComplaints(complaints.filter(complaint => complaint._id !== id));
        } else {
          setComplaints(complaints.map(complaint => 
            complaint._id === id ? { ...complaint, status } : complaint
          ));
        }
        toast.success('Status updated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // View complaint details
  const viewComplaintDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate hours since submission
  const getHoursSinceSubmission = (dateString) => {
    const submissionTime = new Date(dateString).getTime();
    const currentTime = new Date().getTime();
    const hoursDiff = (currentTime - submissionTime) / (1000 * 60 * 60);
    return hoursDiff.toFixed(1);
  };

  // Get urgency level configuration
  const getUrgencyLevel = (hours) => {
    if (hours >= 48) {
      return {
        level: 'critical',
        label: 'Critical',
        color: '#dc2626',
        bgColor: '#fef2f2',
        icon: Flame,
        priority: 4
      };
    } else if (hours >= 24) {
      return {
        level: 'high',
        label: 'High',
        color: '#ea580c',
        bgColor: '#fff7ed',
        icon: AlertTriangle,
        priority: 3
      };
    } else if (hours >= 12) {
      return {
        level: 'medium',
        label: 'Medium',
        color: '#d97706',
        bgColor: '#fffbeb',
        icon: Clock,
        priority: 2
      };
    } else {
      return {
        level: 'low',
        label: 'Low',
        color: '#ca8a04',
        bgColor: '#fefce8',
        icon: Timer,
        priority: 1
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

  // Get unique disaster types from complaints
  const getDisasterTypes = () => {
    const types = [...new Set(complaints.map(c => c.type))];
    return types.sort();
  };

  // Filter and sort complaints based on selected criteria
  const getFilteredAndSortedComplaints = () => {
    // First, filter by disaster type
    let filtered = complaints;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.type.toLowerCase() === filterType.toLowerCase());
    }
    
    // Then, filter by urgency level
    if (filterUrgency !== 'all') {
      filtered = filtered.filter(c => {
        const hours = parseFloat(getHoursSinceSubmission(c.createdAt));
        const urgency = getUrgencyLevel(hours);
        return urgency.level === filterUrgency;
      });
    }
    
    // Finally, sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          const hoursA = parseFloat(getHoursSinceSubmission(a.createdAt));
          const hoursB = parseFloat(getHoursSinceSubmission(b.createdAt));
          return hoursB - hoursA; // Most urgent first
        case 'time':
          return new Date(b.createdAt) - new Date(a.createdAt); // Newest first
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
    return sorted;
  };

  // Get urgency statistics
  const getUrgencyStats = () => {
    const stats = {
      total: complaints.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      verified: 0,
      avgHours: 0
    };

    let totalHours = 0;
    complaints.forEach(complaint => {
      const hours = parseFloat(getHoursSinceSubmission(complaint.createdAt));
      totalHours += hours;
      
      const urgency = getUrgencyLevel(hours);
      stats[urgency.level]++;
      
      if (complaint.verified) {
        stats.verified++;
      }
    });

    stats.avgHours = complaints.length > 0 ? (totalHours / complaints.length).toFixed(1) : 0;
    return stats;
  };

  const stats = getUrgencyStats();
  const disasterTypes = getDisasterTypes();
  const filteredAndSortedComplaints = getFilteredAndSortedComplaints();

  return (
    <Layout isAdmin={true} title="Urgent Complaints">
      <div className="urgent-complaints">
        {/* Alert Header */}
        <motion.div 
          className="alert-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="alert-content">
            <div className="alert-info">
              <div className="alert-icon">
                <Bell size={32} className="pulsing" />
              </div>
              <div className="alert-text">
                <h1 className="alert-title">Urgent Complaints</h1>
                <p className="alert-subtitle">
                  {stats.total > 0 
                    ? `${stats.total} complaints require immediate attention`
                    : 'No urgent complaints at this time'
                  }
                </p>
              </div>
            </div>
            <div className="alert-actions">
              <motion.button
                className="refresh-btn"
                onClick={handleRefresh}
                disabled={refreshing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Urgency Statistics */}
        <motion.div 
          className="urgency-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="stat-card critical">
            <div className="stat-icon">
              <Flame size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.critical}</div>
              <div className="stat-label">Critical (48h+)</div>
            </div>
          </div>

          <div className="stat-card high">
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.high}</div>
              <div className="stat-label">High (24h+)</div>
            </div>
          </div>

          <div className="stat-card medium">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.medium}</div>
              <div className="stat-label">Medium (12h+)</div>
            </div>
          </div>

          <div className="stat-card low">
            <div className="stat-icon">
              <Timer size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.low}</div>
              <div className="stat-label">Low (2h+)</div>
            </div>
          </div>

          <div className="stat-card average">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.avgHours}h</div>
              <div className="stat-label">Avg. Pending</div>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div 
          className="controls-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="filter-controls">
            <div className="filter-group">
              <label>Disaster Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                {disasterTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Urgency Level:</label>
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Levels</option>
                <option value="critical">Critical (48h+)</option>
                <option value="high">High (24h+)</option>
                <option value="medium">Medium (12h+)</option>
                <option value="low">Low (2h+)</option>
              </select>
            </div>

            {(filterType !== 'all' || filterUrgency !== 'all') && (
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setFilterType('all');
                  setFilterUrgency('all');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </motion.div>

        {/* Complaints List */}
        <motion.div 
          className="complaints-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {loading ? (
            <LoadingSkeleton variant="card" count={3} />
          ) : filteredAndSortedComplaints.length === 0 && complaints.length === 0 ? (
            <motion.div 
              className="empty-state success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="success-icon">
                <Shield size={64} />
              </div>
              <h3>All Clear!</h3>
              <p>No urgent complaints found. Great job keeping up with the workload!</p>
            </motion.div>
          ) : filteredAndSortedComplaints.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="empty-icon">
                <Filter size={64} />
              </div>
              <h3>No Matching Complaints</h3>
              <p>No complaints match your current filters. Try adjusting your filter criteria.</p>
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setFilterType('all');
                  setFilterUrgency('all');
                }}
              >
                Clear All Filters
              </button>
            </motion.div>
          ) : (
            <AnimatePresence>
              <div className="urgent-complaints-grid">
                {filteredAndSortedComplaints.map((complaint, index) => {
                  const hours = parseFloat(getHoursSinceSubmission(complaint.createdAt));
                  const urgency = getUrgencyLevel(hours);
                  const UrgencyIcon = urgency.icon;
                  
                  return (
                    <motion.div
                      key={complaint._id}
                      className={`urgent-complaint-card ${urgency.level}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)" }}
                    >
                      <div className="urgency-indicator" style={{ backgroundColor: urgency.color }}>
                        <UrgencyIcon size={16} />
                        {urgency.label}
                      </div>
                      
                      <div className="complaint-header">
                        <div className="complaint-type">
                          <span className="type-emoji">{getTypeIcon(complaint.type)}</span>
                          <span className="type-text">{complaint.type}</span>
                        </div>
                        <div className="complaint-actions">
                          <motion.button
                            className="action-btn"
                            onClick={() => viewComplaintDetails(complaint)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Eye size={16} />
                          </motion.button>
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
                        <div className="meta-item">
                          <Users size={14} />
                          <span>ID: {complaint._id.slice(-6)}</span>
                        </div>
                      </div>

                      <div className="urgency-info" style={{ backgroundColor: urgency.bgColor, color: urgency.color }}>
                        <div className="urgency-time">
                          <Clock size={16} />
                          <span className="time-value">{hours}h</span>
                          <span className="time-label">pending</span>
                        </div>
                        <div className="verification-status">
                          {complaint.verified ? (
                            <span className="verified">
                              <Shield size={14} />
                              Verified
                            </span>
                          ) : (
                            <span className="unverified">
                              <AlertTriangle size={14} />
                              Unverified
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="complaint-attachments">
                        {complaint.image && (
                          <div className="attachment-badge">
                            <Image size={14} />
                            <span>Image</span>
                          </div>
                        )}
                        {complaint.audio && (
                          <div className="attachment-badge">
                            <Mic size={14} />
                            <span>Audio</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="complaint-footer">
                        <motion.button
                          onClick={() => updateStatus(complaint._id, 'in_progress')}
                          disabled={updatingId === complaint._id}
                          className="action-button urgent"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Activity size={16} />
                          {updatingId === complaint._id ? 'Processing...' : 'Start Progress'}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Enhanced Modal */}
        <AnimatePresence>
          {showModal && selectedComplaint && (
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            >
              <motion.div 
                className="modal-content urgent-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header urgent">
                  <div className="header-left">
                    <Bell size={24} />
                    <h3 className="modal-title">Urgent Complaint Details</h3>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="modal-close"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="modal-body">
                  <div className="urgency-alert">
                    {(() => {
                      const hours = parseFloat(getHoursSinceSubmission(selectedComplaint.createdAt));
                      const urgency = getUrgencyLevel(hours);
                      const UrgencyIcon = urgency.icon;
                      
                      return (
                        <div className={`urgency-banner ${urgency.level}`} style={{ backgroundColor: urgency.bgColor, color: urgency.color }}>
                          <UrgencyIcon size={20} />
                          <span className="urgency-text">
                            {urgency.label} Priority - Pending for {hours} hours
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="detail-section">
                    <div className="detail-item">
                      <h4>Type</h4>
                      <div className="detail-value">
                        <span className="type-emoji">{getTypeIcon(selectedComplaint.type)}</span>
                        <span className="capitalize">{selectedComplaint.type}</span>
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <h4>Description</h4>
                      <p className="detail-description">{selectedComplaint.text}</p>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-item">
                        <h4>Submitted On</h4>
                        <div className="detail-value">
                          <Calendar size={16} />
                          {formatDate(selectedComplaint.createdAt)}
                        </div>
                      </div>
                      
                      <div className="detail-item">
                        <h4>Verification</h4>
                        <div className={`verification-badge ${selectedComplaint.verified ? 'verified' : 'unverified'}`}>
                          {selectedComplaint.verified ? (
                            <>
                              <Shield size={16} />
                              Verified
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={16} />
                              Unverified
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <h4>Location</h4>
                      <div className="detail-value">
                        <MapPin size={16} />
                        Lat: {selectedComplaint.location.coordinates[1]}, 
                        Lng: {selectedComplaint.location.coordinates[0]}
                      </div>
                    </div>
                    
                    {selectedComplaint.image && (
                      <div className="detail-item">
                        <h4>Attached Image</h4>
                        <div className="image-container">
                          <img 
                            src={`http://localhost:5001${selectedComplaint.image}`} 
                            alt="Complaint" 
                            className="complaint-image"
                            onClick={() => window.open(`http://localhost:5001${selectedComplaint.image}`, '_blank')}
                          />
                          <p className="image-hint">Click to view full size</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedComplaint.audio && (
                      <div className="detail-item">
                        <h4>Audio Recording</h4>
                        <audio 
                          controls 
                          src={`http://localhost:5001${selectedComplaint.audio}`}
                          className="audio-player"
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="modal-footer urgent">
                  <button
                    onClick={() => setShowModal(false)}
                    className="modal-button secondary"
                  >
                    Close
                  </button>
                  
                  <button
                    onClick={() => {
                      updateStatus(selectedComplaint._id, 'in_progress');
                      setShowModal(false);
                    }}
                    className="modal-button urgent"
                  >
                    <Activity size={18} />
                    Mark In Progress
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default UrgentComplaints;
