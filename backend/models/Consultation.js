const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    index: true
  },
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended', 'failed'],
    default: 'waiting',
    index: true
  },
  participants: [{
    userId: mongoose.Schema.Types.ObjectId,
    role: String,
    socketId: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);
