const mongoose = require('mongoose');

const videoCallSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
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
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended', 'failed'],
    default: 'waiting'
  },
  startedAt: Date,
  endedAt: Date,
  durationSeconds: Number,
  recordingUrl: String,
  connectionEvents: [{
    userId: mongoose.Schema.Types.ObjectId,
    role: String,
    event: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('VideoCall', videoCallSchema);
