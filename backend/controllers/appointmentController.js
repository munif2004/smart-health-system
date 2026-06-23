const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Notification = require('../models/Notification');

const statusNotification = {
  accepted: {
    event: 'appointment-accepted',
    title: 'Appointment Accepted',
    message: 'Your appointment has been accepted by the doctor.',
    type: 'appointment-accepted'
  },
  rejected: {
    event: 'appointment-rejected',
    title: 'Appointment Rejected',
    message: 'Your appointment has been rejected by the doctor.',
    type: 'appointment'
  },
  cancelled: {
    event: 'appointment-cancelled',
    title: 'Appointment Cancelled',
    message: 'Your appointment has been cancelled.',
    type: 'appointment-cancelled'
  }
};

// Get all appointments for user
exports.getUserAppointments = (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  let query = {};
  if (role === 'doctor') {
    query = { doctorId: userId };
  } else {
    query = { patientId: userId };
  }

  Appointment.find(query)
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name specialization averageRating')
    .sort({ appointmentDate: -1 })
    .then(appointments => res.json(appointments))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Book appointment (manual - for cases where auto-booking doesn't apply)
exports.bookAppointment = (req, res) => {
  const { doctorId, symptoms, appointmentDate, appointmentTime, aiPrediction } = req.body;
  const patientId = req.user.userId;

  const appointment = new Appointment({
    patientId,
    doctorId,
    symptoms,
    aiPrediction,
    appointmentDate,
    appointmentTime,
    status: 'scheduled'
  });

  appointment.save()
    .then(apt => {
      // Update doctor workload
      User.findByIdAndUpdate(doctorId, { $inc: { workload: 1 } })
        .then(() => {
          // Notify doctor
          const io = req.app.get('io');
          const notification = new Notification({
            userId: doctorId,
            title: 'New Appointment Booked',
            message: 'A patient booked an appointment with you.',
            type: 'appointment-booked',
            relatedAppointmentId: apt._id
          });

          notification.save().catch(err => console.error('Notification error:', err));

          io.to(`doctor-${doctorId}`).emit('appointment-booked', {
            appointmentId: apt._id,
            patientId,
            notification
          });

          res.status(201).json({
            message: 'Appointment booked successfully',
            appointment: apt
          });
        });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Get appointment details
exports.getAppointmentDetails = (req, res) => {
  const { appointmentId } = req.params;

  Appointment.findById(appointmentId)
    .populate('patientId', 'name email phone age gender')
    .populate('doctorId', 'name specialization')
    .then(appointment => {
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      res.json(appointment);
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  const { appointmentId } = req.params;
  const { status, diagnosis, prescription, notes } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const isAssignedDoctor = req.user.role === 'doctor' && appointment.doctorId.toString() === req.user.userId;
    const isOwnerPatient = req.user.role === 'patient' && appointment.patientId.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isAssignedDoctor && !isOwnerPatient && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const previousStatus = appointment.status;
    appointment.status = status || appointment.status;
    if (diagnosis !== undefined) appointment.diagnosis = diagnosis;
    if (prescription !== undefined) appointment.prescription = prescription;
    if (notes !== undefined) appointment.notes = notes;
    await appointment.save();

    if (['rejected', 'cancelled'].includes(appointment.status) && !['rejected', 'cancelled', 'completed'].includes(previousStatus)) {
      await User.findByIdAndUpdate(appointment.doctorId, { $inc: { workload: -1 } });
    }

    const io = req.app.get('io');
    const notificationData = statusNotification[appointment.status] || {
      event: 'appointment-updated',
      title: 'Appointment Updated',
      message: `Your appointment status has been updated to: ${appointment.status}`,
      type: 'appointment'
    };

    const notification = await Notification.create({
      userId: appointment.patientId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      relatedAppointmentId: appointment._id,
      isRead: false
    });

    const payload = {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      status: appointment.status,
      message: notificationData.message,
      notification
    };

    io.to(`patient-${appointment.patientId}`).emit(notificationData.event, payload);
    io.to(`patient-${appointment.patientId}`).emit('appointment-updated', payload);
    io.to(`doctor-${appointment.doctorId}`).emit('appointment-updated', payload);

    res.json({
      message: 'Appointment updated',
      appointment
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add rating and feedback
exports.rateAppointment = (req, res) => {
  const { appointmentId } = req.params;
  const { rating, feedback } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  Appointment.findByIdAndUpdate(
    appointmentId,
    { rating, feedback },
    { new: true }
  )
    .then(appointment => {
      // Update doctor's average rating
      Appointment.aggregate([
        { $match: { doctorId: appointment.doctorId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
        .then(result => {
          const avgRating = result[0]?.avgRating || 0;
          User.findByIdAndUpdate(
            appointment.doctorId,
            { averageRating: Math.round(avgRating * 10) / 10 }
          ).catch(err => console.error('Error updating rating:', err));
        });

      res.json({
        message: 'Rating submitted successfully',
        appointment
      });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Cancel appointment
exports.cancelAppointment = (req, res) => {
  const { appointmentId } = req.params;

  Appointment.findByIdAndUpdate(
    appointmentId,
    { status: 'cancelled' },
    { new: true }
  )
    .then(appointment => {
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Reduce doctor workload
      User.findByIdAndUpdate(
        appointment.doctorId,
        { $inc: { workload: -1 } }
      ).catch(err => console.error('Error:', err));

      // Notify doctor
      const io = req.app.get('io');
      const targetUserId = req.user.role === 'doctor' ? appointment.patientId : appointment.doctorId;
      new Notification({
        userId: targetUserId,
        title: 'Appointment Cancelled',
        message: 'An appointment has been cancelled.',
        type: 'appointment-cancelled',
        relatedAppointmentId: appointment._id
      }).save().catch(err => console.error('Notification error:', err));

      io.to(`doctor-${appointment.doctorId}`).emit('appointment-cancelled', {
        appointmentId: appointment._id,
        patientId: appointment.patientId
      });

      io.to(`patient-${appointment.patientId}`).emit('appointment-cancelled', {
        appointmentId: appointment._id,
        doctorId: appointment.doctorId
      });

      res.json({ message: 'Appointment cancelled', appointment });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Get emergency appointments (Critical severity)
exports.getEmergencyAppointments = (req, res) => {
  Appointment.find({
    'aiPrediction.severity': 'Critical',
    status: { $ne: 'completed' }
  })
    .populate('patientId', 'name phone')
    .populate('doctorId', 'name specialization')
    .sort({ createdAt: -1 })
    .then(appointments => res.json(appointments))
    .catch(err => res.status(500).json({ error: err.message }));
};
