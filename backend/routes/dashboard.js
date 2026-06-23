const express = require('express');
const router = express.Router();
const {
  getAdvancedAnalytics,
  getDashboardMetrics,
  getPatientDashboard,
  getPatientGrowthTrend,
  getMonthlyStatistics
} = require('../controllers/dashboardController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Protected routes (Admin & Doctor)
router.get('/advanced', authMiddleware, roleMiddleware(['admin', 'doctor']), getAdvancedAnalytics);
router.get('/metrics', authMiddleware, getDashboardMetrics);
router.get('/patient', authMiddleware, roleMiddleware(['patient']), getPatientDashboard);
router.get('/growth-trend', authMiddleware, roleMiddleware(['admin']), getPatientGrowthTrend);
router.get('/monthly', authMiddleware, roleMiddleware(['admin']), getMonthlyStatistics);

module.exports = router;
