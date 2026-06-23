const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  type: {
    type: String,
    enum: ['symptom-analysis', 'consultation', 'report', 'prescription', 'manual-note'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  symptoms: [String],
  diagnosis: String,
  department: String,
  severity: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);
