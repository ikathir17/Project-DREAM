import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Image, 
  Volume2, 
  MapPin, 
  Calendar, 
  User, 
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search,
  Clock
} from 'lucide-react';
import { complaintsAPI } from '../../services/api';
import Layout from '../common/Layout';
import LoadingSkeleton from '../common/LoadingSkeleton';
import './ManualVerification.css';

const ManualVerification = () => {
  const [pendingComplaints, setPendingComplaints] = useState([]);
  const [rejectedComplaints, setRejectedComplaints] = useState([]);
  const [aiRejectedComplaints, setAiRejectedComplaints] = useState([]);
  const [spamComplaints, setSpamComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [verificationReason, setVerificationReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'rejected', 'ai-rejected', or 'spam'

  useEffect(() => {
    fetchManualVerificationComplaints();
  }, []);

  const fetchManualVerificationComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintsAPI.getManualVerificationComplaints();
      
      if (response.data.success) {
        setPendingComplaints(response.data.data.pending || []);
        setRejectedComplaints(response.data.data.rejected || []);
        setAiRejectedComplaints(response.data.data.aiRejected || []);
        setSpamComplaints(response.data.data.spam || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (complaintId, verified, isReVerification = false, isAIOverride = false, isSpamOverride = false) => {
    if (!verificationReason.trim()) {
      toast.error('Please provide a reason for your decision');
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [complaintId]: true }));
      
      const response = isSpamOverride
        ? await complaintsAPI.overrideSpamClassification(complaintId, !verified, verificationReason)
        : isAIOverride
        ? await complaintsAPI.overrideAIRejection(complaintId, verified, verificationReason)
        : isReVerification 
        ? await complaintsAPI.reVerifyComplaint(complaintId, verified, verificationReason)
        : await complaintsAPI.manualVerifyComplaint(complaintId, verified, verificationReason);
      
      if (response.data.success) {
        toast.success(response.data.message);
        
        if (isSpamOverride) {
          // Remove from spam list
          setSpamComplaints(prev => prev.filter(c => c._id !== complaintId));
        } else if (isAIOverride) {
          // Remove from AI rejected list
          setAiRejectedComplaints(prev => prev.filter(c => c._id !== complaintId));
        } else if (isReVerification) {
          // Remove from rejected list
          setRejectedComplaints(prev => prev.filter(c => c._id !== complaintId));
        } else {
          // Remove from pending list
          setPendingComplaints(prev => prev.filter(c => c._id !== complaintId));
          // If rejected, add to rejected list
          if (!verified) {
            const complaint = pendingComplaints.find(c => c._id === complaintId);
            if (complaint) {
              setRejectedComplaints(prev => [complaint, ...prev]);
            }
          }
        }
        
        setShowModal(false);
        setSelectedComplaint(null);
        setVerificationReason('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process verification');
    } finally {
      setProcessing(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  const openVerificationModal = (complaint, verified, isReVerification = false, isAIOverride = false, isSpamOverride = false) => {
    setSelectedComplaint({ 
      ...complaint, 
      verificationDecision: verified, 
      isReVerification,
      isAIOverride,
      isSpamOverride
    });
    setShowModal(true);
    setVerificationReason('');
  };

  const getMediaType = (complaint) => {
    if (complaint.image && complaint.audio) return 'both';
    if (complaint.image) return 'image';
    if (complaint.audio) return 'audio';
    return 'none';
  };

  const currentComplaints = activeTab === 'pending' 
    ? pendingComplaints 
    : activeTab === 'rejected' 
    ? rejectedComplaints 
    : activeTab === 'ai-rejected'
    ? aiRejectedComplaints
    : spamComplaints;
  
  const filteredComplaints = currentComplaints.filter(complaint => {
    const matchesSearch = complaint.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || getMediaType(complaint) === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <Layout isAdmin={true} title="Manual Verification">
      <div className="manual-verification">
        {/* Header */}
        <motion.div 
          className="verification-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <div className="header-info">
              <h1 className="page-title">
                <Eye size={32} />
                Manual Verification
              </h1>
              <p className="page-subtitle">
                Review complaints with image or audio content requiring manual verification
              </p>
            </div>
            <div className="header-actions">
              <motion.button
                className="refresh-btn"
                onClick={fetchManualVerificationComplaints}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                Refresh
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="verification-stats">
            <div className="stat-item">
              <span className="stat-number">{pendingComplaints.length}</span>
              <span className="stat-label">Pending Review</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{rejectedComplaints.length}</span>
              <span className="stat-label">Previously Rejected</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{aiRejectedComplaints.length}</span>
              <span className="stat-label">Rejected by AI</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{spamComplaints.length}</span>
              <span className="stat-label">Marked as Spam</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {currentComplaints.filter(c => c.image && c.audio).length}
              </span>
              <span className="stat-label">Image + Audio</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {currentComplaints.filter(c => c.image && !c.audio).length}
              </span>
              <span className="stat-label">Image Only</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {currentComplaints.filter(c => !c.image && c.audio).length}
              </span>
              <span className="stat-label">Audio Only</span>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="verification-filters"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search complaints or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={16} />
              Pending Review ({pendingComplaints.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
              onClick={() => setActiveTab('rejected')}
            >
              <XCircle size={16} />
              Previously Rejected ({rejectedComplaints.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'ai-rejected' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai-rejected')}
            >
              <AlertTriangle size={16} />
              Rejected by AI ({aiRejectedComplaints.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'spam' ? 'active' : ''}`}
              onClick={() => setActiveTab('spam')}
            >
              <XCircle size={16} />
              Marked as Spam ({spamComplaints.length})
            </button>
          </div>
          
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({currentComplaints.length})
            </button>
            <button 
              className={`filter-tab ${filterType === 'image' ? 'active' : ''}`}
              onClick={() => setFilterType('image')}
            >
              <Image size={16} />
              Image ({currentComplaints.filter(c => c.image && !c.audio).length})
            </button>
            <button 
              className={`filter-tab ${filterType === 'audio' ? 'active' : ''}`}
              onClick={() => setFilterType('audio')}
            >
              <Volume2 size={16} />
              Audio ({currentComplaints.filter(c => !c.image && c.audio).length})
            </button>
            <button 
              className={`filter-tab ${filterType === 'both' ? 'active' : ''}`}
              onClick={() => setFilterType('both')}
            >
              Both ({currentComplaints.filter(c => c.image && c.audio).length})
            </button>
          </div>
        </motion.div>

        {/* Complaints List */}
        {loading ? (
          <LoadingSkeleton variant="card" count={3} />
        ) : filteredComplaints.length === 0 ? (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <CheckCircle size={64} />
            <h3>All Caught Up!</h3>
            <p>No complaints requiring manual verification at the moment.</p>
          </motion.div>
        ) : (
          <motion.div 
            className="complaints-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <AnimatePresence>
              {filteredComplaints.map((complaint, index) => (
                <motion.div
                  key={complaint._id}
                  className="complaint-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)" }}
                >
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="user-info">
                      <User size={20} />
                      <span className="user-name">{complaint.userId?.name || 'Anonymous'}</span>
                      {activeTab === 'ai-rejected' && (
                        <span className="ai-badge">
                          <AlertTriangle size={14} />
                          AI Rejected
                        </span>
                      )}
                      {activeTab === 'spam' && (
                        <span className="spam-badge">
                          <XCircle size={14} />
                          Spam
                        </span>
                      )}
                    </div>
                    <div className="time-info">
                      <Clock size={16} />
                      <span className="time-ago">{getTimeAgo(complaint.createdAt)}</span>
                    </div>
                  </div>

                  {/* Media Indicators */}
                  <div className="media-indicators">
                    {complaint.image && (
                      <div className="media-indicator image">
                        <Image size={16} />
                        <span>Image</span>
                      </div>
                    )}
                    {complaint.audio && (
                      <div className="media-indicator audio">
                        <Volume2 size={16} />
                        <span>Audio</span>
                      </div>
                    )}
                  </div>

                  {/* Complaint Content */}
                  <div className="complaint-content">
                    <div className="complaint-text">
                      <MessageSquare size={16} />
                      <p>{complaint.text}</p>
                    </div>
                    
                    <div className="complaint-meta">
                      <div className="meta-item">
                        <span className="meta-label">Type:</span>
                        <span className="meta-value">{complaint.type}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Created:</span>
                        <span className="meta-value">{formatDate(complaint.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Media Preview */}
                  <div className="media-preview">
                    {complaint.image && (
                      <div className="media-item">
                        <img 
                          src={`http://localhost:5001${complaint.image}`} 
                          alt="Complaint attachment"
                          className="preview-image"
                        />
                      </div>
                    )}
                    {complaint.audio && (
                      <div className="media-item">
                        <audio 
                          controls 
                          className="preview-audio"
                          src={`http://localhost:5001${complaint.audio}`}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="card-actions">
                    {activeTab === 'pending' ? (
                      <>
                        <motion.button
                          className="action-btn verify"
                          onClick={() => openVerificationModal(complaint, true)}
                          disabled={processing[complaint._id]}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <CheckCircle size={18} />
                          Verify
                        </motion.button>
                        
                        <motion.button
                          className="action-btn reject"
                          onClick={() => openVerificationModal(complaint, false)}
                          disabled={processing[complaint._id]}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <XCircle size={18} />
                          Reject
                        </motion.button>
                      </>
                    ) : activeTab === 'ai-rejected' ? (
                      <>
                        <motion.button
                          className="action-btn verify"
                          onClick={() => openVerificationModal(complaint, true, false, true, false)}
                          disabled={processing[complaint._id]}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <CheckCircle size={18} />
                          Override & Verify
                        </motion.button>
                        
                        <motion.button
                          className="action-btn reject"
                          onClick={() => openVerificationModal(complaint, false, false, true, false)}
                          disabled={processing[complaint._id]}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <XCircle size={18} />
                          Confirm AI Decision
                        </motion.button>
                      </>
                    ) : activeTab === 'spam' ? (
                      <>
                        <motion.button
                          className="action-btn verify"
                          onClick={() => openVerificationModal(complaint, true, false, false, true)}
                          disabled={processing[complaint._id]}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <CheckCircle size={18} />
                          Not Spam - Approve
                        </motion.button>
                        
                        <motion.button
                          className="action-btn reject"
                          onClick={() => openVerificationModal(complaint, false, false, false, true)}
                          disabled={processing[complaint._id]}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <XCircle size={18} />
                          Confirm Spam
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          className="action-btn verify"
                          onClick={() => openVerificationModal(complaint, true, true)}
                          disabled={processing[complaint._id]}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <CheckCircle size={18} />
                          Re-Approve
                        </motion.button>
                        
                        <motion.button
                          className="action-btn reject"
                          onClick={() => openVerificationModal(complaint, false, true)}
                          disabled={processing[complaint._id]}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <XCircle size={18} />
                          Confirm Reject
                        </motion.button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Verification Modal */}
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
                className="verification-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>
                    {selectedComplaint.isSpamOverride ? (
                      selectedComplaint.verificationDecision ? (
                        <>
                          <CheckCircle size={24} />
                          Mark as Not Spam & Approve
                        </>
                      ) : (
                        <>
                          <XCircle size={24} />
                          Confirm Spam Classification
                        </>
                      )
                    ) : selectedComplaint.isAIOverride ? (
                      selectedComplaint.verificationDecision ? (
                        <>
                          <CheckCircle size={24} />
                          Override AI & Verify Complaint
                        </>
                      ) : (
                        <>
                          <XCircle size={24} />
                          Confirm AI Rejection
                        </>
                      )
                    ) : selectedComplaint.isReVerification ? (
                      selectedComplaint.verificationDecision ? (
                        <>
                          <CheckCircle size={24} />
                          Re-Approve Complaint
                        </>
                      ) : (
                        <>
                          <XCircle size={24} />
                          Confirm Rejection
                        </>
                      )
                    ) : (
                      selectedComplaint.verificationDecision ? (
                        <>
                          <CheckCircle size={24} />
                          Verify Complaint
                        </>
                      ) : (
                        <>
                          <XCircle size={24} />
                          Reject Complaint
                        </>
                      )
                    )}
                  </h3>
                </div>

                <div className="modal-content">
                  <div className="complaint-summary">
                    <p><strong>User:</strong> {selectedComplaint.userId?.name || 'Anonymous'}</p>
                    <p><strong>Text:</strong> {selectedComplaint.text}</p>
                    <p><strong>Type:</strong> {selectedComplaint.type}</p>
                  </div>

                  <div className="reason-input">
                    <label htmlFor="reason">
                      Reason for {selectedComplaint.isSpamOverride ? 'spam override' : selectedComplaint.isAIOverride ? 'AI override' : selectedComplaint.isReVerification ? 're-verification' : selectedComplaint.verificationDecision ? 'verification' : 'rejection'}:
                    </label>
                    <textarea
                      id="reason"
                      value={verificationReason}
                      onChange={(e) => setVerificationReason(e.target.value)}
                      placeholder={
                        selectedComplaint.isSpamOverride
                          ? `Explain why you're overriding the spam classification to ${selectedComplaint.verificationDecision ? 'approve' : 'keep as spam'} this complaint...`
                          : selectedComplaint.isAIOverride 
                          ? `Explain why you're overriding the AI decision to ${selectedComplaint.verificationDecision ? 'verify' : 'reject'} this complaint...`
                          : `Please provide a reason for ${selectedComplaint.isReVerification ? 're-' : ''}${selectedComplaint.verificationDecision ? 'verifying' : 'rejecting'} this complaint...`
                      }
                      rows={4}
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn secondary"
                    onClick={() => setShowModal(false)}
                    disabled={processing[selectedComplaint._id]}
                  >
                    Cancel
                  </button>
                  <button
                    className={`btn ${selectedComplaint.verificationDecision ? 'primary' : 'danger'}`}
                    onClick={() => handleVerification(
                      selectedComplaint._id, 
                      selectedComplaint.verificationDecision,
                      selectedComplaint.isReVerification,
                      selectedComplaint.isAIOverride,
                      selectedComplaint.isSpamOverride
                    )}
                    disabled={processing[selectedComplaint._id] || !verificationReason.trim()}
                  >
                    {processing[selectedComplaint._id] ? (
                      <>
                        <RefreshCw size={16} className="spinning" />
                        Processing...
                      </>
                    ) : selectedComplaint.isSpamOverride ? (
                      selectedComplaint.verificationDecision ? (
                        <>
                          <CheckCircle size={16} />
                          Not Spam - Approve
                        </>
                      ) : (
                        <>
                          <XCircle size={16} />
                          Confirm Spam
                        </>
                      )
                    ) : selectedComplaint.isAIOverride ? (
                      selectedComplaint.verificationDecision ? (
                        <>
                          <CheckCircle size={16} />
                          Override & Verify
                        </>
                      ) : (
                        <>
                          <XCircle size={16} />
                          Confirm AI Decision
                        </>
                      )
                    ) : selectedComplaint.verificationDecision ? (
                      <>
                        <CheckCircle size={16} />
                        Verify Complaint
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        Reject Complaint
                      </>
                    )}
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

export default ManualVerification;
