const express = require('express');
const router = express.Router();
const { register, login, patientLogin, doctorLogin, getCurrentUser } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/patient/login', patientLogin);
router.post('/doctor/login', doctorLogin);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;
