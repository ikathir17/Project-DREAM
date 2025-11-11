import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await api.put('/notifications/mark-all-read');
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      // Update local state
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      // Update unread count if notification was unread
      const deletedNotif = notifications.find(n => n._id === notificationId);
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Get notification icon and color based on type
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'verified':
        return { icon: '✅', color: '#10b981', bg: '#d1fae5' };
      case 'rejected':
        return { icon: '❌', color: '#ef4444', bg: '#fee2e2' };
      case 'in_progress':
        return { icon: '🔄', color: '#3b82f6', bg: '#dbeafe' };
      case 'resolved':
        return { icon: '✔️', color: '#8b5cf6', bg: '#ede9fe' };
      default:
        return { icon: '📢', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  // Format time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Handle notification click - navigate to complaint and mark as read
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    
    // Close dropdown
    setIsOpen(false);
    
    // Navigate to complaint status page with the specific complaint
    navigate('/user/complaint-status', { 
      state: { highlightComplaintId: notification.complaintId._id } 
    });
  };

  // Load notifications on mount and when dropdown opens
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notification-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={markAllAsRead}
                  disabled={loading}
                >
                  <CheckCheck size={16} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <Bell size={48} strokeWidth={1} />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const style = getNotificationStyle(notification.type);
                  
                  return (
                    <motion.div
                      key={notification._id}
                      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      {/* Icon */}
                      <div
                        className="notification-icon"
                        style={{ backgroundColor: style.bg }}
                      >
                        <span style={{ color: style.color }}>{style.icon}</span>
                      </div>

                      {/* Content - Clickable */}
                      <div 
                        className="notification-content"
                        onClick={() => handleNotificationClick(notification)}
                        style={{ cursor: 'pointer' }}
                      >
                        <p className="notification-message">{notification.message}</p>
                        <span className="notification-time">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="notification-actions">
                        {!notification.read && (
                          <button
                            className="mark-read-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          title="Delete"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="notification-footer">
                <span className="notification-count">
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
