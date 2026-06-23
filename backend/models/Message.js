const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    index: true
  },
  roomId: {
    type: String,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true,
    trim: true
  },
  senderRole: {
    type: String,
    enum: ['doctor', 'patient', 'admin', 'user'],
    default: 'user',
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  message: {
    type: String,
    required: true
  },
  clientMessageId: {
    type: String,
    index: true
  },
  type: {
    type: String,
    enum: ['text', 'system'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  }
}, { timestamps: true });

messageSchema.index({ roomId: 1, createdAt: 1 });
messageSchema.index(
  { roomId: 1, senderId: 1, clientMessageId: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('Message', messageSchema);
