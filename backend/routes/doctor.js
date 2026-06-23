const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const doctorController = require('../controllers/doctorController');

// All doctor routes require authentication and doctor role
router.use(authMiddleware);
router.use(roleMiddleware(['doctor', 'admin']));

// Get doctor's assigned appointments
router.get('/appointments', doctorController.getAssignedAppointments);

// Get specific appointment details
router.get('/appointments/:appointmentId', doctorController.getAppointmentDetails);

// Complete appointment (generates report, sends notification)
router.put('/appointments/:appointmentId/complete', doctorController.completeAppointment);

// Start video call
router.post('/appointments/:appointmentId/video-call', doctorController.startVideoCall);

// Write/update prescription
router.put('/appointments/:appointmentId/prescription', doctorController.writePrescription);

// Get doctor's statistics
router.get('/stats', doctorController.getDoctorStats);

// Update availability status
router.put('/availability', doctorController.updateAvailability);

// Get upcoming appointments
router.get('/appointments-upcoming/list', doctorController.getUpcomingAppointments);

module.exports = router;
