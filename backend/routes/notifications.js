const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
} = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

// Protected routes
router.get('/', authMiddleware, getUserNotifications);
router.get('/unread/count', authMiddleware, getUnreadCount);
router.put('/:notificationId/read', authMiddleware, markAsRead);
router.put('/read/all', authMiddleware, markAllAsRead);
router.delete('/:notificationId', authMiddleware, deleteNotification);

module.exports = router;
