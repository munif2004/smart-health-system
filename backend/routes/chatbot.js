const express = require('express');
const router = express.Router();
const {
  getChatbot,
  sendChatMessage,
  getUserChatHistory,
  clearChatHistory,
  handleQuickButton
} = require('../controllers/chatbotController');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.get('/', getChatbot);
router.post('/message', sendChatMessage);

// Protected routes
router.get('/history', authMiddleware, getUserChatHistory);
router.post('/quick-button', authMiddleware, handleQuickButton);
router.delete('/history', authMiddleware, clearChatHistory);

module.exports = router;
