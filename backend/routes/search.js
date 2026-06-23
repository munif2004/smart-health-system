const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { searchPatients } = require('../controllers/searchController');

router.get('/patients', authMiddleware, roleMiddleware(['doctor', 'admin']), searchPatients);

module.exports = router;
