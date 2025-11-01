import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Activity,
  Calendar,
  MapPin,
  RefreshCw,
  Eye,
  Settings,
  Filter,
  Download,
  Bell,
  Target
} from 'lucide-react';
import { complaintsAPI } from '../../services/api';
import Layout from '../common/Layout';
import LoadingSkeleton from '../common/LoadingSkeleton';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [timeFilter, setTimeFilter] = useState('month'); // 'week', 'month', 'year'
  const [refreshing, setRefreshing] = useState(false);
  const [manualVerificationCount, setManualVerificationCount] = useState(0);

  // Fetch complaint statistics on component mount
  useEffect(() => {
    fetchStats();
    fetchManualVerificationCount();
  }, []);

  // Fetch complaint statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await complaintsAPI.getComplaintStats();
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch manual verification count
  const fetchManualVerificationCount = async () => {
    try {
      const response = await complaintsAPI.getManualVerificationComplaints();
      if (response.data.success) {
        setManualVerificationCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch manual verification count:', error);
    }
  };

  // Refresh dashboard data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchStats();
      await fetchManualVerificationCount();
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
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

  // Calculate performance metrics
  const getPerformanceMetrics = () => {
    if (!stats) return { efficiency: 0, avgResolutionTime: 0, urgentCount: 0 };
    
    const efficiency = stats.resolutionRate || 0;
    const avgResolutionTime = stats.avgResolutionTime || 0;
    const urgentCount = stats.urgentComplaints || 0;
    
    return { efficiency, avgResolutionTime, urgentCount };
  };

  const metrics = getPerformanceMetrics();

  return (
    <Layout isAdmin={true} title="Admin Dashboard">
      <div className="admin-dashboard">
        {/* Dashboard Header */}
        <motion.div 
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <div className="header-info">
              <h1 className="dashboard-title">Admin Dashboard</h1>
              <p className="dashboard-subtitle">
                Monitor and manage emergency assistance requests through DREAM
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

        {loading ? (
          <LoadingSkeleton variant="card" count={4} />
        ) : (
          <>
            {/* Key Metrics Cards */}
            <motion.div 
              className="metrics-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div 
                className="metric-card total"
                whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)" }}
              >
                <div className="metric-icon">
                  <FileText size={32} />
                </div>
                <div className="metric-content">
                  <div className="metric-number">{stats?.totalComplaints || 0}</div>
                  <div className="metric-label">Total Complaints</div>
                  <div className="metric-change positive">
                    <TrendingUp size={16} />
                    +12% from last month
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="metric-card pending"
                whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)" }}
              >
                <div className="metric-icon">
                  <Clock size={32} />
                </div>
                <div className="metric-content">
                  <div className="metric-number">{stats?.pendingComplaints || 0}</div>
                  <div className="metric-label">Pending Review</div>
                  <div className="metric-change neutral">
                    <AlertTriangle size={16} />
                    Needs attention
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="metric-card progress"
                whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)" }}
              >
                <div className="metric-icon">
                  <Activity size={32} />
                </div>
                <div className="metric-content">
                  <div className="metric-number">{stats?.inProgressComplaints || 0}</div>
                  <div className="metric-label">In Progress</div>
                  <div className="metric-change neutral">
                    <Target size={16} />
                    Active cases
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="metric-card resolved"
                whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)" }}
              >
                <div className="metric-icon">
                  <CheckCircle size={32} />
                </div>
                <div className="metric-content">
                  <div className="metric-number">{stats?.resolvedComplaints || 0}</div>
                  <div className="metric-label">Resolved</div>
                  <div className="metric-change positive">
                    <CheckCircle size={16} />
                    {stats?.resolutionRate || 0}% success rate
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Performance Overview */}
            <motion.div 
              className="performance-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="section-header">
                <h2 className="section-title">
                  <BarChart3 size={24} />
                  Performance Overview
                </h2>
              </div>

              <div className="performance-grid">
                <div className="performance-card">
                  <div className="performance-header">
                    <h3>Resolution Efficiency</h3>
                    <div className="performance-value">{metrics.efficiency}%</div>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar efficiency"
                      style={{ width: `${metrics.efficiency}%` }}
                    ></div>
                  </div>
                  <div className="performance-footer">
                    <span className="performance-label">Target: 85%</span>
                    <span className={`performance-status ${metrics.efficiency >= 85 ? 'good' : 'needs-improvement'}`}>
                      {metrics.efficiency >= 85 ? 'Excellent' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>

                <div className="performance-card">
                  <div className="performance-header">
                    <h3>Urgent Complaints</h3>
                    <div className="performance-value urgent">{metrics.urgentCount}</div>
                  </div>
                  <div className="urgent-indicator">
                    <AlertTriangle size={20} />
                    <span>Requires immediate attention</span>
                  </div>
                  <div className="performance-footer">
                    <Link to="/admin/urgent-complaints" className="urgent-link">
                      View All Urgent →
                    </Link>
                  </div>
                </div>

                <div className="performance-card">
                  <div className="performance-header">
                    <h3>Response Time</h3>
                    <div className="performance-value">{metrics.avgResolutionTime}h</div>
                  </div>
                  <div className="response-time-indicator">
                    <Clock size={20} />
                    <span>Average resolution time</span>
                  </div>
                  <div className="performance-footer">
                    <span className="performance-label">Target: &lt; 24h</span>
                    <span className={`performance-status ${metrics.avgResolutionTime <= 24 ? 'good' : 'needs-improvement'}`}>
                      {metrics.avgResolutionTime <= 24 ? 'On Track' : 'Delayed'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              className="actions-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="section-header">
                <h2 className="section-title">
                  <Settings size={24} />
                  Quick Actions
                </h2>
              </div>

              <div className="actions-grid">
                <motion.div 
                  className="action-card primary"
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="action-icon">
                    <FileText size={40} />
                  </div>
                  <div className="action-content">
                    <h3>Manage All Complaints</h3>
                    <p>Review, verify, and update complaint statuses</p>
                    <Link to="/admin/complaints" className="action-button primary">
                      <Eye size={18} />
                      View Complaints
                    </Link>
                  </div>
                </motion.div>

                <motion.div 
                  className="action-card urgent"
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="action-icon">
                    <AlertTriangle size={40} />
                  </div>
                  <div className="action-content">
                    <h3>Urgent Complaints</h3>
                    <p>Handle time-sensitive emergency cases</p>
                    <Link to="/admin/urgent-complaints" className="action-button urgent">
                      <Bell size={18} />
                      View Urgent ({metrics.urgentCount})
                    </Link>
                  </div>
                </motion.div>

                <motion.div 
                  className={`action-card ${manualVerificationCount > 0 ? 'urgent' : 'secondary'}`}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="action-icon">
                    <Eye size={40} />
                    {manualVerificationCount > 0 && (
                      <span className="notification-badge">{manualVerificationCount}</span>
                    )}
                  </div>
                  <div className="action-content">
                    <h3>Manual Verification</h3>
                    <p>Review complaints with media content</p>
                    <Link to="/admin/manual-verification" className={`action-button ${manualVerificationCount > 0 ? 'urgent' : 'secondary'}`}>
                      <Eye size={18} />
                      Review Media ({manualVerificationCount})
                    </Link>
                  </div>
                </motion.div>

                <motion.div 
                  className="action-card secondary"
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="action-icon">
                    <BarChart3 size={40} />
                  </div>
                  <div className="action-content">
                    <h3>Analytics & Reports</h3>
                    <p>Generate detailed performance reports</p>
                    <button className="action-button secondary">
                      <Download size={18} />
                      Export Report
                    </button>
                  </div>
                </motion.div>

                <motion.div 
                  className="action-card secondary"
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="action-icon">
                    <MapPin size={40} />
                  </div>
                  <div className="action-content">
                    <h3>Location Analytics</h3>
                    <p>View complaint distribution by area</p>
                    <button className="action-button secondary">
                      <MapPin size={18} />
                      View Map
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
