import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  MapPin, 
  Image, 
  Mic, 
  RefreshCw,
  Download,
  MoreVertical,
  X,
  Shield,
  Activity,
  Users,
  TrendingUp
} from 'lucide-react';
import { complaintsAPI } from '../../services/api';
import Layout from '../common/Layout';
import LoadingSkeleton from '../common/LoadingSkeleton';
import './ComplaintManagement.css';

const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch admin complaints on component mount
  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter complaints based on search and filters
  useEffect(() => {
    let filtered = complaints;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(complaint =>
        complaint.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.type === typeFilter);
    }

    // Verification filter
    if (verificationFilter !== 'all') {
      const isVerified = verificationFilter === 'verified';
      filtered = filtered.filter(complaint => complaint.verified === isVerified);
    }

    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, statusFilter, typeFilter, verificationFilter]);

  // Fetch admin complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintsAPI.getAdminComplaints();
      
      if (response.data.success) {
        setComplaints(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  // Refresh complaints
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchComplaints();
      toast.success('Complaints refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh complaints');
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
        // Update local state
        setComplaints(complaints.map(complaint => 
          complaint._id === id ? { ...complaint, status } : complaint
        ));
        toast.success('Status updated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Verify a complaint
  const verifyComplaint = async (id) => {
    try {
      setUpdatingId(id);
      const response = await complaintsAPI.verifyComplaint(id);
      
      if (response.data.success) {
        // Update local state
        setComplaints(complaints.map(complaint => 
          complaint._id === id ? { ...complaint, verified: true } : complaint
        ));
        toast.success('Complaint verified successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify complaint');
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
          icon: Activity,
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
          icon: FileText,
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

  // Get stats
  const getStats = () => {
    const total = filteredComplaints.length;
    const pending = filteredComplaints.filter(c => c.status === 'pending').length;
    const inProgress = filteredComplaints.filter(c => c.status === 'in_progress').length;
    const resolved = filteredComplaints.filter(c => c.status === 'resolved').length;
    const verified = filteredComplaints.filter(c => c.verified).length;
    
    return { total, pending, inProgress, resolved, verified };
  };

  const stats = getStats();
  const complaintTypes = getComplaintTypes();

  return (
    <Layout isAdmin={true} title="Complaint Management">
      <div className="complaint-management">
        {/* Header Section */}
        <motion.div 
          className="management-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <div className="header-info">
              <h1 className="header-title">Complaint Management</h1>
              <p className="header-subtitle">
                Review, verify, and manage all disaster complaints
              </p>
            </div>
            <div className="header-actions">
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

        {/* Stats Overview */}
        <motion.div 
          className="stats-overview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="stat-item">
            <div className="stat-icon total">
              <FileText size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Complaints</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon pending">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon progress">
              <Activity size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.inProgress}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon resolved">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.resolved}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon verified">
              <Shield size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.verified}</div>
              <div className="stat-label">Verified</div>
            </div>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div 
          className="filters-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
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
              <FileText size={18} />
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

            <div className="filter-group">
              <Shield size={18} />
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
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
          ) : filteredComplaints.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <FileText size={64} className="empty-icon" />
              <h3>No Complaints Found</h3>
              <p>
                {complaints.length === 0 
                  ? "No complaints have been submitted yet." 
                  : "No complaints match your current filters."
                }
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              <div className="complaints-grid">
                {filteredComplaints.map((complaint, index) => {
                  const statusConfig = getStatusConfig(complaint.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <motion.div
                      key={complaint._id}
                      className="complaint-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)" }}
                    >
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
                        <div className="status-section">
                          <div className="status-badge" style={{ 
                            backgroundColor: statusConfig.bgColor, 
                            color: statusConfig.textColor 
                          }}>
                            <StatusIcon size={14} />
                            {statusConfig.label}
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
                        
                        <div className="action-buttons">
                          {!complaint.verified && (
                            <motion.button
                              onClick={() => verifyComplaint(complaint._id)}
                              disabled={updatingId === complaint._id}
                              className="action-button verify"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Shield size={16} />
                              {updatingId === complaint._id ? 'Verifying...' : 'Verify'}
                            </motion.button>
                          )}
                          
                          {complaint.status === 'pending' && (
                            <motion.button
                              onClick={() => updateStatus(complaint._id, 'in_progress')}
                              disabled={updatingId === complaint._id}
                              className="action-button progress"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Activity size={16} />
                              {updatingId === complaint._id ? 'Updating...' : 'Start Progress'}
                            </motion.button>
                          )}
                          
                          {complaint.status !== 'resolved' && (
                            <motion.button
                              onClick={() => updateStatus(complaint._id, 'resolved')}
                              disabled={updatingId === complaint._id}
                              className="action-button resolve"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <CheckCircle size={16} />
                              {updatingId === complaint._id ? 'Resolving...' : 'Resolve'}
                            </motion.button>
                          )}
                        </div>
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
                className="modal-content"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3 className="modal-title">
                    <FileText size={24} />
                    Complaint Details
                  </h3>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="modal-close"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="modal-body">
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
                        <h4>Status</h4>
                        <div className="status-badge" style={{ 
                          backgroundColor: getStatusConfig(selectedComplaint.status).bgColor, 
                          color: getStatusConfig(selectedComplaint.status).textColor 
                        }}>
                          {React.createElement(getStatusConfig(selectedComplaint.status).icon, { size: 16 })}
                          {getStatusConfig(selectedComplaint.status).label}
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
                      <h4>Submitted On</h4>
                      <div className="detail-value">
                        <Calendar size={16} />
                        {formatDate(selectedComplaint.createdAt)}
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
                    
                    {selectedComplaint.helpNeeded && selectedComplaint.helpNeeded.length > 0 && (
                      <div className="detail-item">
                        <h4>Help Needed</h4>
                        <div className="help-badges">
                          {selectedComplaint.helpNeeded.map((help, index) => (
                            <span key={index} className="help-badge">
                              {help.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
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
                
                <div className="modal-footer">
                  <button
                    onClick={() => setShowModal(false)}
                    className="modal-button secondary"
                  >
                    Close
                  </button>
                  
                  {!selectedComplaint.verified && (
                    <button
                      onClick={() => {
                        verifyComplaint(selectedComplaint._id);
                        setShowModal(false);
                      }}
                      className="modal-button verify"
                    >
                      <Shield size={18} />
                      Verify Complaint
                    </button>
                  )}
                  
                  {selectedComplaint.status !== 'resolved' && (
                    <button
                      onClick={() => {
                        updateStatus(selectedComplaint._id, 'resolved');
                        setShowModal(false);
                      }}
                      className="modal-button resolve"
                    >
                      <CheckCircle size={18} />
                      Mark Resolved
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default ComplaintManagement;
