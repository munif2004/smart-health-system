const express = require('express');
const router = express.Router();
const {
  generateReport,
  getPatientReports,
  getReportsByDateRange,
  exportMultipleReports,
  getReportSummary,
  getPatientPrescriptions,
  generatePrescriptionPDF
} = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');

// Protected routes
router.get('/', authMiddleware, getPatientReports);
router.get('/summary', authMiddleware, getReportSummary);
router.get('/prescriptions', authMiddleware, getPatientPrescriptions);
router.get('/prescriptions/:prescriptionId/download', authMiddleware, generatePrescriptionPDF);
router.get('/range', authMiddleware, getReportsByDateRange);
router.get('/:appointmentId/download', authMiddleware, generateReport);
router.post('/export/batch', authMiddleware, exportMultipleReports);

module.exports = router;
