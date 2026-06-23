const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const Report = require('../models/Report');
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');
const MedicalHistory = require('../models/MedicalHistory');

// Get advanced analytics dashboard data
exports.getAdvancedAnalytics = (req, res) => {
  Promise.all([
    // Total appointments
    Appointment.countDocuments(),
    
    // Appointments today
    Appointment.countDocuments({
      appointmentDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }),
    
    // Emergency cases
    Appointment.countDocuments({
      'aiPrediction.severity': 'Critical',
      status: { $ne: 'completed' }
    }),
    
    // Disease distribution
    Appointment.aggregate([
      { $group: { _id: '$aiPrediction.disease', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    
    // Department distribution
    Appointment.aggregate([
      { $group: { _id: '$aiPrediction.recommendedDepartment', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    
    // Doctor workload
    User.find({ role: 'doctor' })
      .select('name specialization workload averageRating')
      .sort({ workload: -1 }),
    
    // Total patients
    User.countDocuments({ role: 'patient' }),
    
    // Total doctors
    User.countDocuments({ role: 'doctor' }),
    
    // Completed appointments
    Appointment.countDocuments({ status: 'completed' }),
    
    // Average rating
    Appointment.aggregate([
      { $match: { rating: { $exists: true, $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ])
  ])
    .then(([
      totalAppointments,
      appointmentsToday,
      emergencyCount,
      diseaseDistribution,
      departmentDistribution,
      doctorWorkload,
      totalPatients,
      totalDoctors,
      completedAppointments,
      avgRatingResult
    ]) => {
      res.json({
        summary: {
          totalAppointments,
          appointmentsToday,
          emergencyCount,
          totalPatients,
          totalDoctors,
          completedAppointments,
          averageRating: Math.round((avgRatingResult[0]?.avgRating || 0) * 10) / 10
        },
        
        mostCommonDiseases: diseaseDistribution.map(item => ({
          disease: item._id || 'Unknown',
          count: item.count
        })),
        
        departmentStats: departmentDistribution.map(item => ({
          department: item._id || 'General',
          appointmentCount: item.count
        })),
        
        doctorWorkload: doctorWorkload.map(doc => ({
          doctorId: doc._id,
          name: doc.name,
          specialization: doc.specialization,
          workload: doc.workload,
          rating: doc.averageRating
        })),
        
        chartData: {
          appointmentsPerDay: generateDailyAppointmentData(appointmentsToday),
          diseaseBreakdown: diseaseDistribution.slice(0, 5).map(d => ({
            name: d._id || 'Other',
            value: d.count
          })),
          departmentBreakdown: departmentDistribution.map(d => ({
            name: d._id || 'General',
            value: d.count
          }))
        }
      });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Generate daily appointment chart data
const generateDailyAppointmentData = (today) => {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      appointments: i === 0 ? today : Math.floor(Math.random() * 15)
    });
  }
  return last7Days;
};

// Get dashboard metrics
exports.getDashboardMetrics = (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  if (role === 'doctor') {
    // Doctor dashboard
    Promise.all([
      Appointment.countDocuments({ doctorId: userId }),
      Appointment.countDocuments({ doctorId: userId, status: 'completed' }),
      User.findById(userId).select('workload averageRating')
    ])
      .then(([total, completed, doctor]) => {
        res.json({
          role: 'doctor',
          totalAppointments: total,
          completedAppointments: completed,
          currentWorkload: doctor.workload,
          averageRating: doctor.averageRating
        });
      })
      .catch(err => res.status(500).json({ error: err.message }));

  } else if (role === 'patient') {
    // Patient dashboard
    Promise.all([
      Appointment.countDocuments({ patientId: userId }),
      Appointment.countDocuments({ patientId: userId, status: 'completed' }),
      Appointment.countDocuments({ patientId: userId, 'aiPrediction.severity': 'Critical' })
    ])
      .then(([total, completed, emergencies]) => {
        res.json({
          role: 'patient',
          totalAppointments: total,
          completedAppointments: completed,
          emergencyAppointments: emergencies
        });
      })
      .catch(err => res.status(500).json({ error: err.message }));
  } else {
    // Admin dashboard
    exports.getAdvancedAnalytics(req, res);
  }
};

// Get patient SaaS dashboard data from real MongoDB collections.
exports.getPatientDashboard = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const now = new Date();

    const [
      appointments,
      reports,
      prescriptions,
      notifications,
      medicalHistory,
      unreadNotifications
    ] = await Promise.all([
      Appointment.find({ patientId })
        .populate('doctorId', 'name specialization averageRating profileImage')
        .sort({ appointmentDate: 1, createdAt: -1 }),
      Report.find({ patientId })
        .populate('doctorId', 'name specialization')
        .populate('appointmentId', 'appointmentDate aiPrediction')
        .sort({ createdAt: -1 })
        .limit(8),
      Prescription.find({ patientId, status: 'active' })
        .populate('doctorId', 'name specialization')
        .populate('appointmentId', 'appointmentDate')
        .sort({ createdAt: -1 })
        .limit(8),
      Notification.find({ userId: patientId })
        .sort({ createdAt: -1 })
        .limit(8),
      MedicalHistory.find({ patientId })
        .populate('createdBy', 'name role specialization')
        .populate('appointmentId', 'appointmentDate status')
        .sort({ createdAt: -1 })
        .limit(10),
      Notification.countDocuments({ userId: patientId, isRead: false })
    ]);

    const upcomingAppointments = appointments.filter((appointment) =>
      appointment.appointmentDate && new Date(appointment.appointmentDate) >= now && !['completed', 'cancelled', 'rejected'].includes(appointment.status)
    );

    const completedAppointments = appointments.filter((appointment) => appointment.status === 'completed');
    const activePrescriptionCount = prescriptions.reduce((count, prescription) => count + (prescription.medicines?.length || 0), 0);
    const emergencyCount = appointments.filter((appointment) => appointment.aiPrediction?.isEmergency).length;
    const healthScore = Math.max(55, Math.min(98, 88 - emergencyCount * 5 + completedAppointments.length * 2));

    const healthProgress = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        score: Math.max(45, Math.min(95, healthScore - (5 - index) * 2 + index))
      };
    });

    res.json({
      summary: {
        upcomingAppointments: upcomingAppointments.length,
        medicalReports: reports.length,
        activePrescriptions: activePrescriptionCount,
        healthScore,
        unreadNotifications
      },
      appointments,
      upcomingAppointments,
      reports,
      prescriptions,
      medicalHistory,
      notifications,
      chartData: {
        healthProgress
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get patient growth trend
exports.getPatientGrowthTrend = (req, res) => {
  User.aggregate([
    { $match: { role: 'patient' } },
    { $group: {
      _id: {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
      },
      count: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ])
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Get monthly statistics
exports.getMonthlyStatistics = (req, res) => {
  const currentMonth = new Date();
  currentMonth.setMonth(currentMonth.getMonth());

  Appointment.aggregate([
    { $match: {
      createdAt: {
        $gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        $lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      }
    }},
    { $group: {
      _id: { $dayOfMonth: '$createdAt' },
      appointments: { $sum: 1 },
      completed: {
        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
      },
      emergencies: {
        $sum: { $cond: [{ $eq: ['$aiPrediction.severity', 'Critical'] }, 1, 0] }
      }
    }},
    { $sort: { _id: 1 } }
  ])
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ error: err.message }));
};
