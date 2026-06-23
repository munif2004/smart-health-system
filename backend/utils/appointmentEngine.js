const User = require('../models/User');
const Appointment = require('../models/Appointment');

// Find best available doctor based on specialization, availability, and workload
const findBestDoctor = async (specialization) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      specialization: specialization || 'General',
      isAvailable: true
    }).sort({ workload: 1, averageRating: -1 });

    if (doctors.length === 0 && specialization !== 'General') {
      return findBestDoctor('General');
    }

    if (doctors.length === 0) {
      return null;
    }

    return doctors[0]; // Return doctor with least workload
  } catch (error) {
    console.error('Error finding best doctor:', error);
    return null;
  }
};

// Auto-book appointment with best doctor
const autoBookAppointment = async (patientId, symptoms, aiPrediction, options = {}) => {
  try {
    const bestDoctor = await findBestDoctor(aiPrediction.recommendedDepartment);
    
    if (!bestDoctor) {
      return { success: false, error: 'No available doctors' };
    }

    // Set appointment for next available slot (example: 24 hours from now)
    const appointmentDate = options.appointmentDate ? new Date(options.appointmentDate) : new Date();
    if (!options.appointmentDate) {
      appointmentDate.setDate(appointmentDate.getDate() + 1);
      appointmentDate.setHours(10, 0, 0, 0);
    }

    const appointment = new Appointment({
      patientId,
      doctorId: bestDoctor._id,
      symptoms,
      aiPrediction,
      appointmentDate,
      appointmentTime: options.appointmentTime || '10:00 AM',
      status: 'scheduled'
    });

    await appointment.save();

    // Update doctor workload
    await User.findByIdAndUpdate(bestDoctor._id, {
      $inc: { workload: 1 }
    });

    return {
      success: true,
      appointment,
      doctor: {
        id: bestDoctor._id,
        _id: bestDoctor._id,
        name: bestDoctor.name,
        specialization: bestDoctor.specialization,
        rating: bestDoctor.averageRating
      }
    };
  } catch (error) {
    console.error('Error auto-booking appointment:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { findBestDoctor, autoBookAppointment };
