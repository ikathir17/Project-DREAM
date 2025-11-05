import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  LayoutDashboard, 
  FileText, 
  AlertTriangle, 
  MapPin, 
  Menu, 
  X, 
  LogOut,
  User,
  Eye,
  Moon,
  Sun
} from 'lucide-react';
import { complaintsAPI } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationBell from '../user/NotificationBell';
import './Navbar.css';

const Navbar = ({ isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [manualVerificationCount, setManualVerificationCount] = useState(0);
  const [urgentComplaintsCount, setUrgentComplaintsCount] = useState(0);
  const user = JSON.parse(localStorage.getItem('user'));

  // Fetch manual verification count and urgent complaints count for admin users
  useEffect(() => {
    if (isAdmin) {
      fetchManualVerificationCount();
      fetchUrgentComplaintsCount();
      // Refresh counts every 30 seconds
      const interval = setInterval(() => {
        fetchManualVerificationCount();
        fetchUrgentComplaintsCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="navbar-container">
        <Link to={isAdmin ? '/admin' : '/user'} className="navbar-brand">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Shield size={24} className="brand-icon" />
          </motion.div>
          <span className="brand-text">DREAM</span>
        </Link>
        
        <motion.button 
          className="mobile-menu-button" 
          onClick={toggleMobileMenu}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {mobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={20} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        
        <div className="navbar-links">
          {isAdmin ? (
            // Admin Navigation Links
            <>
              <motion.div whileHover={{ y: -2 }}>
                <Link to="/admin" className={`navbar-link ${isActive('/admin')}`}>
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }}>
                <Link to="/admin/complaints" className={`navbar-link ${isActive('/admin/complaints')}`}>
                  <FileText size={18} />
                  Complaints
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} style={{ position: 'relative' }}>
                <Link to="/admin/urgent-complaints" className={`navbar-link ${isActive('/admin/urgent-complaints')}`}>
                  <AlertTriangle size={18} />
                  Urgent
                  {urgentComplaintsCount > 0 && (
                    <span className="nav-notification-badge">{urgentComplaintsCount}</span>
                  )}
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} style={{ position: 'relative' }}>
                <Link to="/admin/manual-verification" className={`navbar-link ${isActive('/admin/manual-verification')}`}>
                  <Eye size={18} />
                  Manual Review
                  {manualVerificationCount > 0 && (
                    <span className="nav-notification-badge">{manualVerificationCount}</span>
                  )}
                </Link>
              </motion.div>
            </>
          ) : (
            // User Navigation Links
            <>
              <motion.div whileHover={{ y: -2 }}>
                <Link to="/user" className={`navbar-link ${isActive('/user')}`}>
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }}>
                <Link to="/user/submit-complaint" className={`navbar-link ${isActive('/user/submit-complaint')}`}>
                  <FileText size={18} />
                  Submit
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }}>
                <Link to="/user/complaint-status" className={`navbar-link ${isActive('/user/complaint-status')}`}>
                  <User size={18} />
                  My Complaints
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }}>
                <Link to="/user/nearby-complaints" className={`navbar-link ${isActive('/user/nearby-complaints')}`}>
                  <MapPin size={18} />
                  Nearby
                </Link>
              </motion.div>
            </>
          )}
        </div>
        
        <div className="navbar-user">
          <span className="user-info">
            <User size={16} className="user-icon" />
            {user?.mobileNumber}
          </span>
          
          {/* Notification Bell - Only for regular users */}
          {!isAdmin && <NotificationBell />}
          
          <motion.button 
            onClick={toggleTheme}
            className="theme-toggle-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <AnimatePresence mode="wait">
              {isDarkMode ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun size={16} />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon size={16} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.button 
            onClick={handleLogout}
            className="logout-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={16} />
            Logout
          </motion.button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isAdmin ? (
              // Admin Mobile Links
              <>
                <Link to="/admin" className="mobile-menu-link" onClick={toggleMobileMenu}>
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
                <Link to="/admin/complaints" className="mobile-menu-link" onClick={toggleMobileMenu}>
                  <FileText size={18} />
                  Complaints
                </Link>
                <Link to="/admin/urgent-complaints" className="mobile-menu-link" onClick={toggleMobileMenu} style={{ position: 'relative' }}>
                  <AlertTriangle size={18} />
                  Urgent
                  {urgentComplaintsCount > 0 && (
                    <span className="nav-notification-badge">{urgentComplaintsCount}</span>
                  )}
                </Link>
                <Link to="/admin/manual-verification" className="mobile-menu-link" onClick={toggleMobileMenu} style={{ position: 'relative' }}>
                  <Eye size={18} />
                  Manual Review
                  {manualVerificationCount > 0 && (
                    <span className="nav-notification-badge">{manualVerificationCount}</span>
                  )}
                </Link>
              </>
            ) : (
              // User Mobile Links
              <>
                <Link to="/user" className="mobile-menu-link" onClick={toggleMobileMenu}>
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
                <Link to="/user/submit-complaint" className="mobile-menu-link" onClick={toggleMobileMenu}>
                  <FileText size={18} />
                  Submit Complaint
                </Link>
                <Link to="/user/complaint-status" className="mobile-menu-link" onClick={toggleMobileMenu}>
                  <User size={18} />
                  My Complaints
                </Link>
                <Link to="/user/nearby-complaints" className="mobile-menu-link" onClick={toggleMobileMenu}>
                  <MapPin size={18} />
                  Nearby Complaints
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
