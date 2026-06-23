const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const Prescription = require('../models/Prescription');
const MedicalHistory = require('../models/MedicalHistory');
const VideoCall = require('../models/VideoCall');
const Consultation = require('../models/Consultation');
const PDFDocument = require('pdfkit');

const getDoctorQuery = (doctorId) => ({ doctorId });

// Get doctor's assigned appointments
exports.getAssignedAppointments = async (req, res) => {
  try {
    const doctorId = req.user.userId;

    const appointments = await Appointment.find(getDoctorQuery(doctorId))
      .populate('patientId', 'name email phone age gender medicalHistory allergies')
      .populate('doctorId', 'name specialization averageRating')
      .sort({ appointmentDate: 1, createdAt: -1 });

    res.json({
      message: 'Appointments retrieved successfully',
      doctorId,
      appointments,
      total: appointments.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get appointment details
exports.getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.userId;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'name email medicalHistory allergies')
      .populate('doctorId', 'name specialization');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify doctor is assigned to this appointment
    if (appointment.doctorId._id.toString() !== doctorId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Complete appointment and generate report
exports.completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { diagnosis, medicines = [], advice, notes, vitals, followUpDate } = req.body;
    const doctorId = req.user.userId;
    const io = req.app.get('io');

    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify doctor is assigned to this appointment
    if (appointment.doctorId._id.toString() !== doctorId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Update appointment status
    appointment.status = 'completed';
    appointment.diagnosis = diagnosis || 'Not provided';
    appointment.prescription = {
      medicines,
      advice,
      prescribedAt: new Date()
    };
    appointment.notes = notes || 'No notes';
    appointment.completedAt = new Date();

    const report = await Report.create({
      appointmentId: appointment._id,
      patientId: appointment.patientId._id,
      doctorId,
      diagnosis: diagnosis || 'Not provided',
      medicines,
      advice,
      vitals,
      followUpDate
    });

    let prescriptionDoc = null;
    if (medicines.length > 0) {
      prescriptionDoc = await Prescription.create({
        appointmentId: appointment._id,
        patientId: appointment.patientId._id,
        doctorId,
        medicines,
        advice
      });
      appointment.prescriptionId = prescriptionDoc._id;
    }

    appointment.reportId = report._id;
    await appointment.save();

    await MedicalHistory.create({
      patientId: appointment.patientId._id,
      appointmentId: appointment._id,
      type: 'report',
      title: `Consultation report - ${diagnosis || 'General consultation'}`,
      symptoms: appointment.symptoms,
      diagnosis,
      department: appointment.doctorId.specialization,
      severity: appointment.aiPrediction?.severity,
      notes: advice || notes,
      createdBy: doctorId
    });

    if (prescriptionDoc) {
      await MedicalHistory.create({
        patientId: appointment.patientId._id,
        appointmentId: appointment._id,
        type: 'prescription',
        title: 'Prescription added',
        diagnosis: diagnosis || 'Not provided',
        notes: advice || notes,
        createdBy: doctorId
      });
    }

    // Decrement doctor workload
    await User.findByIdAndUpdate(doctorId, {
      $inc: { workload: -1 }
    });

    // Send notification to patient
    const patientNotification = new Notification({
      userId: appointment.patientId._id,
      title: 'Report Generated',
      message: `Your appointment with Dr. ${appointment.doctorId.name} has been completed. Report is ready for download.`,
      type: 'report-generated',
      isRead: false
    });
    await patientNotification.save();

    let prescriptionNotification = null;
    if (prescriptionDoc) {
      prescriptionNotification = new Notification({
        userId: appointment.patientId._id,
        title: 'Prescription Added',
        message: `Dr. ${appointment.doctorId.name} added a prescription to your appointment.`,
        type: 'prescription-added',
        relatedAppointmentId: appointment._id,
        isRead: false
      });
      await prescriptionNotification.save();
    }

    // Emit Socket.io event to patient
    io.to(`patient-${appointment.patientId._id}`).emit('report-generated', {
      appointmentId: appointment._id,
      reportId: report._id,
      status: 'completed',
      message: 'Your appointment has been completed. Report is now available.'
    });

    if (prescriptionDoc) {
      io.to(`patient-${appointment.patientId._id}`).emit('prescription-added', {
        appointmentId: appointment._id,
        prescriptionId: prescriptionDoc._id,
        prescription: prescriptionDoc,
        notification: prescriptionNotification
      });
    }

    io.to(`patient-${appointment.patientId._id}`).emit('appointment-updated', {
      appointmentId: appointment._id,
      status: appointment.status
    });
    io.to(`doctor-${doctorId}`).emit('appointment-updated', {
      appointmentId: appointment._id,
      status: appointment.status
    });

    res.json({
      message: 'Appointment completed successfully',
      appointment,
      report,
      prescription: prescriptionDoc,
      notification: patientNotification,
      prescriptionNotification
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Start video call notification
exports.startVideoCall = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.userId;
    const io = req.app.get('io');

    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'name')
      .populate('doctorId', 'name');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify doctor is assigned
    if (appointment.doctorId._id.toString() !== doctorId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const videoRoomId = appointment.videoRoomId || `call-${appointmentId}`;

    // Update appointment with video call info
    appointment.videoRoomId = videoRoomId;
    appointment.videoCallStartedAt = new Date();
    appointment.status = 'in-progress';
    await appointment.save();

    await VideoCall.findOneAndUpdate(
      { roomId: videoRoomId },
      {
        appointmentId: appointment._id,
        patientId: appointment.patientId._id,
        doctorId,
        roomId: videoRoomId,
        status: 'waiting',
        startedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Consultation.findOneAndUpdate(
      { roomId: videoRoomId },
      {
        appointmentId: appointment._id,
        patientId: appointment.patientId._id,
        doctorId,
        roomId: videoRoomId,
        status: 'waiting',
        startTime: appointment.videoCallStartedAt
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Emit Socket.io event to patient
    io.to(`patient-${appointment.patientId._id}`).emit('video-call-incoming', {
      doctorName: appointment.doctorId.name,
      videoRoomId: videoRoomId,
      appointmentId: appointmentId
    });

    io.to(`patient-${appointment.patientId._id}`).emit('appointment-updated', {
      appointmentId: appointment._id,
      status: appointment.status,
      videoRoomId
    });

    res.json({
      message: 'Video call initiated',
      videoRoomId,
      appointmentId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Write/update prescription
exports.writePrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { medications, medicines, dosage, duration, notes, advice } = req.body;
    const doctorId = req.user.userId;
    const io = req.app.get('io');

    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'name');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify doctor is assigned
    if (appointment.doctorId.toString() !== doctorId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const normalizedMedicines = medicines || (medications || []).map((name) => ({
      name,
      dosage,
      duration,
      instructions: notes
    }));

    const prescriptionDoc = await Prescription.findOneAndUpdate(
      { appointmentId, doctorId },
      {
        appointmentId,
        patientId: appointment.patientId._id,
        doctorId,
        medicines: normalizedMedicines,
        advice: advice || notes
      },
      { new: true, upsert: true }
    );

    appointment.prescription = {
      medicines: normalizedMedicines,
      advice: advice || notes,
      prescribedAt: new Date()
    };
    appointment.prescriptionId = prescriptionDoc._id;

    await appointment.save();

    await MedicalHistory.create({
      patientId: appointment.patientId._id,
      appointmentId: appointment._id,
      type: 'prescription',
      title: 'Prescription added',
      diagnosis: appointment.diagnosis,
      notes: advice || notes,
      createdBy: doctorId
    });

    // Send notification to patient
    const notification = new Notification({
      userId: appointment.patientId._id,
      title: 'Prescription Updated',
      message: 'Your doctor has prescribed medications. Check your appointment details.',
      type: 'prescription-added',
      isRead: false
    });
    await notification.save();

    // Emit Socket.io event
    io.to(`patient-${appointment.patientId._id}`).emit('prescription-received', {
      appointmentId,
      prescription: appointment.prescription
    });

    res.json({
      message: 'Prescription saved successfully',
      appointment,
      prescription: prescriptionDoc,
      notification
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get doctor's statistics
exports.getDoctorStats = async (req, res) => {
  try {
    const doctorId = req.user.userId;

    const doctor = await User.findById(doctorId).select('-password');

    const totalAppointments = await Appointment.countDocuments({ doctorId });
    const completedAppointments = await Appointment.countDocuments({
      doctorId,
      status: 'completed'
    });
    const pendingAppointments = await Appointment.countDocuments({
      doctorId,
      status: 'scheduled'
    });
    const inProgressAppointments = await Appointment.countDocuments({
      doctorId,
      status: 'in-progress'
    });

    // Calculate average rating
    const appointmentsWithRatings = await Appointment.find({
      doctorId,
      rating: { $exists: true, $ne: null }
    });

    const averageRating = appointmentsWithRatings.length > 0
      ? (appointmentsWithRatings.reduce((sum, apt) => sum + apt.rating, 0) / appointmentsWithRatings.length).toFixed(1)
      : 0;

    res.json({
      doctor,
      stats: {
        totalAppointments,
        completedAppointments,
        pendingAppointments,
        inProgressAppointments,
        averageRating,
        workload: doctor.workload
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update doctor availability
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable, upiId, consultationFee, qrCodeUrl } = req.body;
    const doctorId = req.user.userId;

    const update = {};
    if (isAvailable !== undefined) update.isAvailable = isAvailable;
    if (upiId !== undefined) update.upiId = upiId;
    if (consultationFee !== undefined) update.consultationFee = consultationFee;
    if (qrCodeUrl !== undefined) update.qrCodeUrl = qrCodeUrl;

    const doctor = await User.findByIdAndUpdate(
      doctorId,
      update,
      { new: true }
    ).select('-password');

    res.json({
      message: 'Doctor profile settings updated',
      doctor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get upcoming appointments for today/week
exports.getUpcomingAppointments = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const appointments = await Appointment.find({
      doctorId,
      appointmentDate: { $gte: today, $lt: nextWeek },
      status: { $in: ['scheduled', 'in-progress'] }
    })
      .populate('patientId', 'name email')
      .sort({ appointmentDate: 1 });

    res.json({
      message: 'Upcoming appointments retrieved',
      appointments,
      count: appointments.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
