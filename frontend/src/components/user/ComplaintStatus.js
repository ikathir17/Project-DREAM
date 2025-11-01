import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Eye, 
  MoreVertical,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { complaintsAPI } from '../../services/api';
import Layout from '../common/Layout';
import LoadingSkeleton from '../common/LoadingSkeleton';
import './ComplaintStatus.css';

const ComplaintStatus = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Fetch user complaints on component mount
  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter complaints based on search and status
  useEffect(() => {
    let filtered = complaints;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(complaint =>
        complaint.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }
    
    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, statusFilter]);

  // Fetch user complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintsAPI.getUserComplaints();
      
      if (response.data.success) {
        setComplaints(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
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

  // Get stats
  const getStats = () => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    
    return { total, pending, inProgress, resolved };
  };

  const stats = getStats();

  return (
    <Layout title="My Complaints">
      <div className="complaints-page">
        {/* Stats Cards */}
        <motion.div 
          className="stats-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="stat-card total">
            <div className="stat-icon">
              <FileText size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Complaints</div>
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

        {/* Filters and Search */}
        <motion.div 
          className="filters-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
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
            
            <motion.button
              className="refresh-btn"
              onClick={fetchComplaints}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={18} className={loading ? 'spinning' : ''} />
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* Complaints List */}
        <motion.div 
          className="complaints-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
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
                  ? "You haven't submitted any complaints yet." 
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
                            onClick={() => setSelectedComplaint(complaint)}
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
                        {complaint.location && (
                          <div className="meta-item">
                            <MapPin size={14} />
                            <span>Location Available</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="complaint-footer">
                        <div className="status-badge" style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.textColor }}>
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </div>
                        
                        <div className="verification-status">
                          {complaint.verified ? (
                            <span className="verified">✓ Verified</span>
                          ) : (
                            <span className="unverified">⏳ Pending Verification</span>
                          )}
                        </div>
                      </div>
                      
                      {complaint.status !== 'resolved' && (
                        <div className="complaint-actions-footer">
                          {complaint.status === 'pending' && (
                            <motion.button
                              onClick={() => updateStatus(complaint._id, 'in_progress')}
                              disabled={updatingId === complaint._id}
                              className="action-button secondary"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {updatingId === complaint._id ? 'Updating...' : 'Mark In Progress'}
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => updateStatus(complaint._id, 'resolved')}
                            disabled={updatingId === complaint._id}
                            className="action-button primary"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {updatingId === complaint._id ? 'Updating...' : 'Mark Resolved'}
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default ComplaintStatus;
