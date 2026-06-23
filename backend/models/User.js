const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  phone: String,
  dateOfBirth: Date,
  address: String,
  bloodGroup: String,
  age: Number,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  // For Doctors
  specialization: {
    type: String,
    enum: ['Cardiology', 'Neurology', 'Dermatology', 'Orthopedics', 'General', 'Emergency', 'Pediatrics', 'Psychiatry'],
    required: function() { return this.role === 'doctor'; }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  upiId: {
    type: String,
    trim: true
  },
  qrCodeUrl: String,
  availableSlots: [{
    day: String,
    times: [String]
  }],
  qualifications: [String],
  experienceYears: {
    type: Number,
    default: 0
  },
  workload: {
    type: Number,
    default: 0 // Number of active appointments
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  // For Patients
  medicalHistory: [String],
  chronicConditions: [String],
  allergies: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  profileImage: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

userSchema.index({ role: 1, name: 1 });
userSchema.index({ role: 1, email: 1 });
userSchema.index({ role: 1, phone: 1 });

module.exports = mongoose.model('User', userSchema);
