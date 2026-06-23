const User = require('../models/User');
const MedicalHistory = require('../models/MedicalHistory');

// Get all users (Admin only)
exports.getAllUsers = (req, res) => {
  User.find()
    .select('-password')
    .then(users => res.json(users))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Get user by ID
exports.getUserById = (req, res) => {
  User.findById(req.params.id)
    .select('-password')
    .then(user => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Get all doctors
exports.getAllDoctors = (req, res) => {
  User.find({ role: 'doctor' })
    .select('-password')
    .then(doctors => res.json(doctors))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Get doctors by specialization
exports.getDoctorsBySpecialization = (req, res) => {
  const { specialization } = req.params;
  
  User.find({ role: 'doctor', specialization })
    .select('-password')
    .then(doctors => res.json(doctors))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Update user profile
exports.updateUserProfile = (req, res) => {
  const { name, phone, age, gender, allergies, medicalHistory } = req.body;

  User.findByIdAndUpdate(
    req.user.userId,
    {
      name,
      phone,
      age,
      gender,
      allergies,
      medicalHistory
    },
    { new: true }
  )
    .select('-password')
    .then(user => res.json({ message: 'Profile updated', user }))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Update doctor availability (Doctor only)
exports.updateDoctorAvailability = (req, res) => {
  const { isAvailable } = req.body;

  User.findByIdAndUpdate(
    req.user.userId,
    { isAvailable },
    { new: true }
  )
    .then(user => res.json({ message: 'Availability updated', isAvailable: user.isAvailable }))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Update doctor specialization (Admin only)
exports.updateDoctorSpecialization = (req, res) => {
  const { doctorId, specialization } = req.body;

  User.findByIdAndUpdate(
    doctorId,
    { specialization },
    { new: true }
  )
    .then(user => res.json({ message: 'Specialization updated', specialization: user.specialization }))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Get doctor workload
exports.getDoctorWorkload = (req, res) => {
  User.findById(req.params.doctorId)
    .then(doctor => {
      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
      res.json({ doctorId: doctor._id, name: doctor.name, workload: doctor.workload });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Get logged-in patient's medical timeline
exports.getMedicalHistory = (req, res) => {
  const patientId = req.user.role === 'patient' ? req.user.userId : req.params.patientId;

  if (!patientId) {
    return res.status(400).json({ error: 'Patient id is required' });
  }

  MedicalHistory.find({ patientId })
    .populate('appointmentId', 'appointmentDate status')
    .populate('createdBy', 'name role specialization')
    .sort({ createdAt: -1 })
    .then(history => res.json(history))
    .catch(err => res.status(500).json({ error: err.message }));
};
