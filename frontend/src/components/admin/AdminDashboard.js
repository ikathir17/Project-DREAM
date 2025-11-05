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
  const [urgentComplaintsCount, setUrgentComplaintsCount] = useState(0);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Fetch complaint statistics on component mount
  useEffect(() => {
    fetchStats();
    fetchManualVerificationCount();
    fetchUrgentComplaintsCount();
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

  // Fetch urgent complaints count
  const fetchUrgentComplaintsCount = async () => {
    try {
      const response = await complaintsAPI.getUrgentComplaints();
      if (response.data.success) {
        setUrgentComplaintsCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch urgent complaints count:', error);
    }
  };

  // Refresh dashboard data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchStats();
      await fetchManualVerificationCount();
      await fetchUrgentComplaintsCount();
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  // Generate comprehensive report
  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      toast.info('Generating comprehensive report...');

      // Fetch all complaints with full details
      const response = await complaintsAPI.getAllComplaints();
      
      if (response.data.success) {
        const allComplaints = response.data.data;
        
        // Categorize complaints
        const verifiedComplaints = allComplaints.filter(c => c.verified && !c.isSpam);
        const unverifiedComplaints = allComplaints.filter(c => !c.verified && !c.isSpam);
        const spamComplaints = allComplaints.filter(c => c.isSpam);
        
        // Generate CSV content
        const csvContent = generateCSVReport(verifiedComplaints, unverifiedComplaints, spamComplaints);
        
        // Download CSV file
        downloadCSV(csvContent, `DREAM_Comprehensive_Report_${new Date().toISOString().split('T')[0]}.csv`);
        
        toast.success('Report generated successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Generate CSV report content
  const generateCSVReport = (verified, unverified, spam) => {
    const headers = [
      'Complaint ID',
      'Status',
      'Verification Status',
      'Is Spam',
      'Category',
      'Description',
      'Urgency Level',
      'User Name',
      'User Email',
      'User Phone',
      'Location (Lat, Long)',
      'Address',
      'Has Image',
      'Has Audio',
      'Created Date',
      'Updated Date',
      'Resolution Time (hours)',
      'Admin Notes'
    ].join(',');

    const formatComplaint = (complaint) => {
      const resolutionTime = complaint.resolvedAt 
        ? ((new Date(complaint.resolvedAt) - new Date(complaint.createdAt)) / (1000 * 60 * 60)).toFixed(2)
        : 'N/A';

      return [
        complaint._id,
        complaint.status || 'N/A',
        complaint.verified ? 'Verified' : 'Unverified',
        complaint.isSpam ? 'Yes' : 'No',
        complaint.category || 'N/A',
        `"${(complaint.text || '').replace(/"/g, '""')}"`, // Escape quotes
        complaint.urgencyLevel || 'N/A',
        complaint.userId?.name || 'N/A',
        complaint.userId?.email || 'N/A',
        complaint.userId?.phone || 'N/A',
        `"${complaint.location?.coordinates?.[1] || 'N/A'}, ${complaint.location?.coordinates?.[0] || 'N/A'}"`,
        `"${(complaint.address || 'N/A').replace(/"/g, '""')}"`,
        complaint.image ? 'Yes' : 'No',
        complaint.audio ? 'Yes' : 'No',
        new Date(complaint.createdAt).toLocaleString(),
        new Date(complaint.updatedAt).toLocaleString(),
        resolutionTime,
        `"${(complaint.verificationReason || 'N/A').replace(/"/g, '""')}"`
      ].join(',');
    };

    // Build CSV sections
    const sections = [];
    
    // Summary section
    sections.push('COMPLAINT SUMMARY');
    sections.push(`Total Complaints,${verified.length + unverified.length + spam.length}`);
    sections.push(`Verified Complaints,${verified.length}`);
    sections.push(`Unverified Complaints,${unverified.length}`);
    sections.push(`Spam Complaints,${spam.length}`);
    sections.push('');
    
    // Verified complaints
    sections.push('VERIFIED COMPLAINTS');
    sections.push(headers);
    verified.forEach(c => sections.push(formatComplaint(c)));
    sections.push('');
    
    // Unverified complaints
    sections.push('UNVERIFIED COMPLAINTS');
    sections.push(headers);
    unverified.forEach(c => sections.push(formatComplaint(c)));
    sections.push('');
    
    // Spam complaints
    sections.push('SPAM COMPLAINTS');
    sections.push(headers);
    spam.forEach(c => sections.push(formatComplaint(c)));
    
    return sections.join('\n');
  };

  // Download CSV file
  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    if (!stats) return { efficiency: 0, avgResolutionTime: 0, avgResolutionMinutes: 0, urgentCount: 0 };
    
    const efficiency = stats.resolutionRate || 0;
    const avgResolutionTime = stats.avgResolutionTime || 0;
    const avgResolutionMinutes = Math.round(avgResolutionTime * 60); // Convert hours to minutes
    const urgentCount = stats.urgentComplaints || 0;
    
    return { efficiency, avgResolutionTime, avgResolutionMinutes, urgentCount };
  };

  const metrics = getPerformanceMetrics();
  
  // Format time display
  const formatResponseTime = (hours, minutes) => {
    if (hours === 0 && minutes === 0) return '0h 0m';
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes % 60}m`;
  };

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
                Monitor and manage verified emergency assistance requests through DREAM
              </p>
              <p className="dashboard-note">
                📊 Analytics shown for verified complaints only (excluding spam and unverified)
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
                    <div className="performance-value">
                      {formatResponseTime(Math.floor(metrics.avgResolutionTime), metrics.avgResolutionMinutes)}
                    </div>
                  </div>
                  <div className="response-time-indicator">
                    <Clock size={20} />
                    <span>Average resolution time ({metrics.avgResolutionMinutes} minutes)</span>
                  </div>
                  <div className="performance-footer">
                    <span className="performance-label">Target: &lt; 24h (1440m)</span>
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
                    {urgentComplaintsCount > 0 && (
                      <span className="notification-badge">{urgentComplaintsCount}</span>
                    )}
                  </div>
                  <div className="action-content">
                    <h3>Urgent Complaints</h3>
                    <p>Handle time-sensitive emergency cases (2+ hours pending)</p>
                    <Link to="/admin/urgent-complaints" className="action-button urgent">
                      <Bell size={18} />
                      View Urgent ({urgentComplaintsCount})
                    </Link>
                  </div>
                </motion.div>

                <motion.div 
                  className={`action-card ${manualVerificationCount > 0 ? 'urgent' : 'verification'}`}
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
                    <Link to="/admin/manual-verification" className={`action-button ${manualVerificationCount > 0 ? 'urgent' : 'verification'}`}>
                      <Eye size={18} />
                      Review Media ({manualVerificationCount})
                    </Link>
                  </div>
                </motion.div>

                <motion.div 
                  className="action-card analytics"
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="action-icon">
                    <BarChart3 size={40} />
                  </div>
                  <div className="action-content">
                    <h3>Analytics & Reports</h3>
                    <p>Generate detailed performance reports with all complaint data</p>
                    <button 
                      className="action-button analytics"
                      onClick={handleGenerateReport}
                      disabled={generatingReport}
                    >
                      <Download size={18} className={generatingReport ? 'spinning' : ''} />
                      {generatingReport ? 'Generating...' : 'Export Report'}
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
