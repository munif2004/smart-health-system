const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentType: {
    type: String,
    enum: ['online', 'cash'],
    default: 'online',
    index: true
  },
  provider: {
    type: String,
    enum: ['razorpay', 'upi', 'cash'],
    default: 'upi'
  },
  transactionId: {
    type: String,
    index: true
  },
  upiTransactionId: {
    type: String,
    index: true
  },
  paymentReference: {
    type: String,
    unique: true,
    index: true
  },
  orderId: String,
  paymentMethod: {
    type: String,
    enum: ['Google Pay', 'PhonePe', 'Paytm', 'UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'Cash', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['Pending', 'Submitted', 'Verified', 'Paid', 'Failed', 'Rejected'],
    default: 'Pending',
    index: true
  },
  upiId: String,
  upiQrData: String,
  paymentProofUrl: String,
  screenshotUrl: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  paidAt: Date,
  failureReason: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

paymentSchema.index({ patientId: 1, createdAt: -1 });
paymentSchema.index({ doctorId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
