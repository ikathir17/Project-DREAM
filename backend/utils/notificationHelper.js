const Notification = require('../models/Notification');

/**
 * Create a notification for a user about their complaint status
 * @param {ObjectId} userId - User ID
 * @param {ObjectId} complaintId - Complaint ID
 * @param {String} type - Notification type
 * @param {String} message - Notification message
 */
async function createNotification(userId, complaintId, type, message) {
  try {
    const notification = await Notification.create({
      userId,
      complaintId,
      type,
      message,
      read: false
    });
    
    console.log(`📬 Notification created for user ${userId}: ${type}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Create notification when complaint is verified
 */
async function notifyComplaintVerified(userId, complaintId, complaintType) {
  const shortId = complaintId.toString().slice(-6).toUpperCase();
  const message = `Complaint #${shortId}: Your ${complaintType} complaint has been verified. Help is on the way!`;
  return createNotification(userId, complaintId, 'verified', message);
}

/**
 * Create notification when complaint is rejected
 */
async function notifyComplaintRejected(userId, complaintId, complaintType, reason) {
  const shortId = complaintId.toString().slice(-6).toUpperCase();
  const message = `Complaint #${shortId}: Your ${complaintType} complaint requires manual verification by our team.`;
  return createNotification(userId, complaintId, 'rejected', message);
}

/**
 * Create notification when complaint status changes to in_progress
 */
async function notifyComplaintInProgress(userId, complaintId, complaintType) {
  const shortId = complaintId.toString().slice(-6).toUpperCase();
  const message = `Complaint #${shortId}: Your ${complaintType} complaint is being addressed by our team.`;
  return createNotification(userId, complaintId, 'in_progress', message);
}

/**
 * Create notification when complaint is resolved
 */
async function notifyComplaintResolved(userId, complaintId, complaintType) {
  const shortId = complaintId.toString().slice(-6).toUpperCase();
  const message = `Complaint #${shortId}: Your ${complaintType} complaint has been resolved. Thank you!`;
  return createNotification(userId, complaintId, 'resolved', message);
}

/**
 * Create notification for any status change
 */
async function notifyStatusChange(userId, complaintId, complaintType, oldStatus, newStatus) {
  const shortId = complaintId.toString().slice(-6).toUpperCase();
  const message = `Complaint #${shortId}: Your ${complaintType} complaint status updated to "${newStatus}".`;
  return createNotification(userId, complaintId, 'status_change', message);
}

module.exports = {
  createNotification,
  notifyComplaintVerified,
  notifyComplaintRejected,
  notifyComplaintInProgress,
  notifyComplaintResolved,
  notifyStatusChange
};
