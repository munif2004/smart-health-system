const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: [String],
  aiPrediction: {
    disease: String,
    confidence: Number,
    severity: String,
    recommendedDepartment: String,
    urgency: String,
    isEmergency: Boolean,
    extractedSymptoms: [String],
    recommendations: [String],
    source: String
  },
  appointmentDate: Date,
  appointmentTime: String,
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notes: String,
  diagnosis: String,
  prescription: {
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    advice: String,
    prescribedAt: Date
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  videoRoomId: String,
  videoCallStartedAt: Date,
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Submitted', 'Verified', 'Paid', 'Failed', 'Rejected'],
    default: 'Pending',
    index: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  completedAt: Date,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
