const express = require('express');
const router = express.Router();
const {
  getUserAppointments,
  bookAppointment,
  getAppointmentDetails,
  updateAppointmentStatus,
  rateAppointment,
  cancelAppointment,
  getEmergencyAppointments
} = require('../controllers/appointmentController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Protected routes
router.get('/', authMiddleware, getUserAppointments);
router.get('/emergency/list', authMiddleware, roleMiddleware(['doctor', 'admin']), getEmergencyAppointments);
router.get('/:appointmentId', authMiddleware, getAppointmentDetails);

router.post('/book', authMiddleware, bookAppointment);
router.put('/:appointmentId/status', authMiddleware, updateAppointmentStatus);
router.put('/:appointmentId/rate', authMiddleware, rateAppointment);
router.delete('/:appointmentId/cancel', authMiddleware, cancelAppointment);

module.exports = router;
