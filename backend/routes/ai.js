const express = require('express');
const router = express.Router();
const {
  checkSymptoms,
  aiChat,
  autoBookAppointmentBySymptoms,
  getPredictionDetails,
  getChatHistory,
  quickButtonInteraction
} = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.post('/symptom-check', checkSymptoms);
router.post('/chat', aiChat);

// Protected routes
router.post('/auto-book', authMiddleware, autoBookAppointmentBySymptoms);
router.get('/prediction/:appointmentId', authMiddleware, getPredictionDetails);
router.get('/chat-history', authMiddleware, getChatHistory);
router.post('/quick-button', authMiddleware, quickButtonInteraction);

module.exports = router;
