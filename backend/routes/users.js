const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  getAllDoctors,
  getDoctorsBySpecialization,
  updateUserProfile,
  updateDoctorAvailability,
  updateDoctorSpecialization,
  getDoctorWorkload,
  getMedicalHistory
} = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Protected routes
router.get('/', authMiddleware, roleMiddleware(['admin']), getAllUsers);
router.get('/doctors/all', authMiddleware, getAllDoctors);
router.get('/doctors/specialization/:specialization', authMiddleware, getDoctorsBySpecialization);
router.get('/doctors/:doctorId/workload', authMiddleware, getDoctorWorkload);
router.get('/me/medical-history', authMiddleware, getMedicalHistory);
router.get('/patients/:patientId/medical-history', authMiddleware, roleMiddleware(['doctor', 'admin']), getMedicalHistory);
router.get('/:id', authMiddleware, getUserById);

router.put('/profile', authMiddleware, updateUserProfile);
router.put('/doctor/availability', authMiddleware, roleMiddleware(['doctor']), updateDoctorAvailability);
router.put('/doctor/specialization', authMiddleware, roleMiddleware(['admin']), updateDoctorSpecialization);

module.exports = router;
