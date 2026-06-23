const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['patient', 'doctor', 'admin']
  },
  conversation: [{
    role: {
      type: String,
      enum: ['user', 'assistant']
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['text', 'quick-button'],
      default: 'text'
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

chatHistorySchema.index({ userId: 1, lastActiveAt: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
