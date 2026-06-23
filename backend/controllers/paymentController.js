const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { streamInvoicePdf } = require('../services/invoiceService');

const createPaymentReference = () => `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const buildUpiPaymentData = ({ upiId, name, amount, transactionNote }) => {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name || 'Hospital AI',
    am: String(amount),
    cu: 'INR',
    tn: transactionNote || 'Hospital AI payment'
  });
  return `upi://pay?${params.toString()}`;
};

const notifyPayment = async (req, payment, title, message) => {
  const io = req.app.get('io');
  const notification = await Notification.create({
    userId: payment.doctorId,
    title,
    message,
    type: 'payment',
    relatedAppointmentId: payment.appointmentId,
    isRead: false
  });

  io.to(`doctor-${payment.doctorId}`).emit('payment-success', { payment, notification });
  io.to(`user-${payment.doctorId}`).emit('payment-success', { payment, notification });
};

exports.createPaymentOrder = async (req, res) => {
  return exports.createUpiPayment(req, res);
};

exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const {
      transactionId,
      upiTransactionId,
      paymentMethod = 'UPI',
      status = 'Pending',
      screenshotUrl,
      paymentProofUrl
    } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    const ownsPayment = payment.patientId.toString() === req.user.userId || payment.doctorId.toString() === req.user.userId;
    if (!ownsPayment && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    if (!['Submitted', 'Verified', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }
    if (['Verified', 'Rejected'].includes(status) && !['doctor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only doctor/admin can verify or reject payment' });
    }

    payment.transactionId = transactionId || upiTransactionId || payment.transactionId;
    payment.upiTransactionId = upiTransactionId || payment.upiTransactionId;
    payment.paymentMethod = paymentMethod;
    payment.screenshotUrl = screenshotUrl || paymentProofUrl || payment.screenshotUrl;
    payment.paymentProofUrl = paymentProofUrl || screenshotUrl || payment.paymentProofUrl;
    payment.status = status;
    payment.paidAt = status === 'Verified' ? new Date() : payment.paidAt;
    if (req.user.role === 'admin' || req.user.role === 'doctor') {
      payment.verifiedBy = req.user.userId;
      payment.verifiedAt = ['Verified', 'Rejected'].includes(status) ? new Date() : payment.verifiedAt;
    }
    await payment.save();

    if (payment.appointmentId) {
      await Appointment.findByIdAndUpdate(payment.appointmentId, {
        paymentStatus: payment.status,
        paymentId: payment._id
      });
    }

    if (req.user.role === 'patient' && payment.status === 'Pending' && (payment.upiTransactionId || payment.screenshotUrl || payment.paymentProofUrl)) {
      await notifyPayment(req, payment, 'UPI Payment Proof Submitted', `Payment proof for ${payment.currency} ${payment.amount} is waiting for verification.`);
    }

    if (payment.status === 'Verified') {
      await notifyPayment(req, payment, 'Payment Received', `Payment of ${payment.currency} ${payment.amount} has been received.`);
      req.app.get('io').to(`patient-${payment.patientId}`).emit('payment-success', { payment });
      req.app.get('io').to(`user-${payment.patientId}`).emit('payment-success', { payment });
    }

    res.json({ message: 'Payment updated', payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUpiPayment = async (req, res) => {
  try {
    const { appointmentId, doctorId, amount, paymentProofUrl, screenshotUrl, upiTransactionId, paymentMethod = 'UPI' } = req.body;
    if (!appointmentId || !doctorId) return res.status(400).json({ error: 'Appointment and doctor are required' });
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.patientId.toString() !== req.user.userId || appointment.doctorId.toString() !== doctorId) {
      return res.status(403).json({ error: 'Invalid appointment for this payment' });
    }
    const doctor = await User.findById(doctorId).select('name upiId consultationFee');
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    const upiId = doctor.upiId || process.env.DEFAULT_UPI_ID || 'hospitalai@upi';

    const finalAmount = Number(amount || doctor.consultationFee || 500);
    if (finalAmount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
    const upiQrData = buildUpiPaymentData({
      upiId,
      name: doctor.name,
      amount: finalAmount,
      transactionNote: `Appointment ${appointmentId || ''}`.trim()
    });

    const payment = await Payment.create({
      userId: req.user.userId,
      patientId: req.user.userId,
      doctorId,
      appointmentId,
      amount: finalAmount,
      paymentType: 'online',
      provider: 'upi',
      paymentMethod,
      paymentReference: createPaymentReference(),
      transactionId: upiTransactionId,
      upiTransactionId,
      upiId,
      upiQrData,
      paymentProofUrl: paymentProofUrl || screenshotUrl,
      screenshotUrl: screenshotUrl || paymentProofUrl,
      status: 'Pending'
    });

    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        paymentStatus: payment.status,
        paymentId: payment._id
      });
    }

    if (paymentProofUrl || screenshotUrl || upiTransactionId) {
      await notifyPayment(req, payment, 'UPI Payment Received', `UPI payment proof submitted for ${payment.currency} ${payment.amount}.`);
    }

    res.status(201).json({ message: 'UPI payment initialized', payment, upiQrData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : req.user.role === 'doctor'
        ? { doctorId: req.user.userId }
        : { patientId: req.user.userId };

    const payments = await Payment.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization upiId consultationFee')
      .populate('appointmentId', 'appointmentDate appointmentTime status')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'appointmentDate appointmentTime status');

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const allowed = payment.patientId._id.toString() === req.user.userId ||
      payment.doctorId._id.toString() === req.user.userId ||
      req.user.role === 'admin';
    if (!allowed) return res.status(403).json({ error: 'Unauthorized access' });

    streamInvoicePdf(payment, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
