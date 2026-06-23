const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: String,
  message: String,
  type: {
    type: String,
    enum: [
      'appointment',
      'appointment-booked',
      'appointment-accepted',
      'appointment-completed',
      'appointment-cancelled',
      'doctor-online',
      'report',
      'report-generated',
      'prescription',
      'prescription-added',
      'payment',
      'payment-success',
      'emergency',
      'system',
      'ai-result'
    ],
    default: 'system'
  },
  relatedAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expire: 2592000 // Auto delete after 30 days
  }
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
