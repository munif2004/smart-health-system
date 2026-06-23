const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  diagnosis: {
    type: String,
    required: true
  },
  medicines: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  advice: String,
  followUpDate: Date,
  vitals: {
    temperature: String,
    bloodPressure: String,
    pulse: String,
    oxygenLevel: String,
    weight: String
  },
  pdfGeneratedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
