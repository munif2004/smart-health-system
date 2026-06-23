const Notification = require('../models/Notification');

// Get notifications for user
exports.getUserNotifications = (req, res) => {
  const userId = req.user.userId;

  Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .then(notifications => res.json(notifications))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Mark notification as read
exports.markAsRead = (req, res) => {
  const { notificationId } = req.params;

  Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true })
    .then(notification => res.json({ message: 'Marked as read', notification }))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Mark all notifications as read
exports.markAllAsRead = (req, res) => {
  const userId = req.user.userId;

  Notification.updateMany({ userId, isRead: false }, { isRead: true })
    .then(() => res.json({ message: 'All notifications marked as read' }))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Get unread notification count
exports.getUnreadCount = (req, res) => {
  const userId = req.user.userId;

  Notification.countDocuments({ userId, isRead: false })
    .then(count => res.json({ unreadCount: count }))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Delete notification
exports.deleteNotification = (req, res) => {
  const { notificationId } = req.params;

  Notification.findByIdAndDelete(notificationId)
    .then(() => res.json({ message: 'Notification deleted' }))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Create notification (used internally)
exports.createNotification = (userId, title, message, type, relatedAppointmentId = null) => {
  new Notification({
    userId,
    title,
    message,
    type,
    relatedAppointmentId
  }).save().catch(err => console.error('Error creating notification:', err));
};
