const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  appointmentsCount: {
    type: Number,
    default: 0
  },
  diseaseCounts: {
    type: Map,
    of: Number,
    default: new Map()
  },
  departmentStats: {
    type: Map,
    of: {
      appointmentCount: Number,
      avgRating: Number
    },
    default: new Map()
  },
  doctorWorkload: [{
    doctorId: mongoose.Schema.Types.ObjectId,
    appointmentCount: Number
  }],
  patientGrowth: Number,
  emergencyCount: {
    type: Number,
    default: 0
  },
  completedAppointments: Number,
  averageAppointmentRating: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
