const Notification = require('../models/Notification');

/**
 * Creates a notification for a single user. Never throws — a notification
 * failure should never break the primary operation (e.g. payroll processing).
 */
async function notifyUser(userId, { title, message, type = 'general', link = null }) {
  try {
    if (!userId) return null;
    return await Notification.create({ user: userId, title, message, type, link });
  } catch (err) {
    console.error('[notify] Failed to create notification:', err.message);
    return null;
  }
}

/**
 * Creates the same notification for many users at once (e.g. all admins).
 */
async function notifyUsers(userIds, payload) {
  return Promise.all(userIds.map((id) => notifyUser(id, payload)));
}

module.exports = { notifyUser, notifyUsers };
