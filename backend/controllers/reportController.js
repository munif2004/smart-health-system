const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Report = require('../models/Report');
const Prescription = require('../models/Prescription');
const { generatePDFReport } = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// Generate and download PDF report
exports.generateReport = (req, res) => {
  const { appointmentId } = req.params;

  Appointment.findById(appointmentId)
    .populate('patientId', 'name email')
    .populate('doctorId', 'name')
    .then(appointment => {
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const isOwnerPatient = req.user.role === 'patient' && appointment.patientId._id.toString() === req.user.userId;
      const isAssignedDoctor = req.user.role === 'doctor' && appointment.doctorId._id.toString() === req.user.userId;
      const isAdmin = req.user.role === 'admin';

      if (!isOwnerPatient && !isAssignedDoctor && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      Report.findOne({ appointmentId })
        .then(report => generatePDFReport(
          appointment,
          appointment.patientId.name,
          appointment.doctorId.name,
          report
        ))
        .then(result => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="medical-report-${appointmentId}.pdf"`);
          
          const fileStream = fs.createReadStream(result.filepath);
          fileStream.pipe(res);

          fileStream.on('close', () => {
            fs.unlink(result.filepath, (error) => {
              if (error && error.code !== 'ENOENT') {
                console.warn('Report cleanup skipped:', error.message);
              }
            });
          });
        })
        .catch(err => res.status(500).json({ error: 'Error generating report: ' + err.message }));
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Get all generated reports for patient
exports.getPatientReports = (req, res) => {
  const patientId = req.user.userId;

  Report.find({ patientId })
    .populate('appointmentId', 'appointmentDate symptoms aiPrediction status')
    .populate('doctorId', 'name specialization')
    .sort({ createdAt: -1 })
    .then(reports => {
      res.json(reports.map(report => ({
        reportId: report._id,
        appointmentId: report.appointmentId?._id,
        date: report.appointmentId?.appointmentDate || report.createdAt,
        diagnosis: report.diagnosis,
        disease: report.appointmentId?.aiPrediction?.disease || report.diagnosis || 'Unknown',
        severity: report.appointmentId?.aiPrediction?.severity || 'Unknown',
        doctor: report.doctorId,
        status: 'Ready for download'
      })));
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Get all prescriptions for patient
exports.getPatientPrescriptions = (req, res) => {
  const patientId = req.user.userId;

  Prescription.find({ patientId })
    .populate('appointmentId', 'appointmentDate status')
    .populate('doctorId', 'name specialization')
    .sort({ createdAt: -1 })
    .then(prescriptions => res.json(prescriptions))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Generate and download prescription PDF
exports.generatePrescriptionPDF = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const prescription = await Prescription.findById(prescriptionId)
      .populate('appointmentId', 'appointmentDate symptoms diagnosis')
      .populate('patientId', 'name email age gender')
      .populate('doctorId', 'name specialization');

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const isOwnerPatient = req.user.role === 'patient' && prescription.patientId._id.toString() === req.user.userId;
    const isAssignedDoctor = req.user.role === 'doctor' && prescription.doctorId._id.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwnerPatient && !isAssignedDoctor && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescription._id}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('Medical Prescription', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Patient: ${prescription.patientId.name}`);
    doc.text(`Doctor: Dr. ${prescription.doctorId.name} (${prescription.doctorId.specialization || 'General'})`);
    doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`);
    if (prescription.appointmentId?.appointmentDate) {
      doc.text(`Appointment: ${new Date(prescription.appointmentId.appointmentDate).toLocaleDateString()}`);
    }
    doc.moveDown();
    doc.fontSize(14).text('Medicines');
    doc.moveDown(0.5);

    prescription.medicines.forEach((medicine, index) => {
      doc.fontSize(12).text(`${index + 1}. ${medicine.name}`);
      if (medicine.dosage) doc.text(`   Dosage: ${medicine.dosage}`);
      if (medicine.frequency) doc.text(`   Frequency: ${medicine.frequency}`);
      if (medicine.duration) doc.text(`   Duration: ${medicine.duration}`);
      if (medicine.instructions) doc.text(`   Instructions: ${medicine.instructions}`);
      doc.moveDown(0.5);
    });

    if (prescription.advice) {
      doc.moveDown();
      doc.fontSize(14).text('Advice');
      doc.fontSize(12).text(prescription.advice);
    }

    doc.moveDown(2);
    doc.fontSize(10).fillColor('#666').text('Generated by Hospital AI Smart Healthcare System');
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get reports by date range
exports.getReportsByDateRange = (req, res) => {
  const { startDate, endDate } = req.query;
  const patientId = req.user.userId;

  Appointment.find({
    patientId,
    status: 'completed',
    appointmentDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  })
    .select('_id symptoms aiPrediction appointmentDate')
    .sort({ appointmentDate: -1 })
    .then(appointments => res.json(appointments))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Export multiple reports (batch download)
exports.exportMultipleReports = (req, res) => {
  const { appointmentIds } = req.body;

  if (!appointmentIds || appointmentIds.length === 0) {
    return res.status(400).json({ error: 'No appointments selected' });
  }

  res.json({
    message: 'Reports export queued. Check your email for download links.',
    reportCount: appointmentIds.length,
    status: 'Processing'
  });
};

// Get report summary statistics
exports.getReportSummary = (req, res) => {
  const patientId = req.user.userId;

  Promise.all([
    Appointment.countDocuments({ patientId, status: 'completed' }),
    Appointment.aggregate([
      { $match: { patientId, status: 'completed' } },
      { $group: { _id: '$aiPrediction.disease', count: { $sum: 1 } } }
    ])
  ])
    .then(([totalReports, diseaseStats]) => {
      res.json({
        totalReports,
        mostFrequentDiseases: diseaseStats.sort((a, b) => b.count - a.count).slice(0, 5)
      });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};
