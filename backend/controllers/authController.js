const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const buildToken = (user) => jwt.sign(
  {
    userId: user._id,
    email: user.email,
    role: user.role,
    name: user.name
  },
  process.env.JWT_SECRET || 'secret',
  { expiresIn: '7d' }
);

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  specialization: user.specialization,
  phone: user.phone,
  age: user.age,
  gender: user.gender,
  profileImage: user.profileImage
});

const loginWithRole = async (req, res, expectedRole = null) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({ error: `Please use the ${user.role} login for this account` });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      token: buildToken(user),
      user: sanitizeUser(user)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Register
exports.register = (req, res) => {
  const {
    name,
    email,
    password,
    role = 'patient',
    specialization,
    phone,
    age,
    gender,
    bloodGroup
  } = req.body;

  // Check if user exists
  User.findOne({ email })
    .then(user => {
      if (user) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role,
        specialization: role === 'doctor' ? specialization : undefined,
        phone,
        age,
        gender,
        bloodGroup
      });

      newUser.save()
        .then(user => {
          res.status(201).json({
            message: 'User registered successfully',
            userId: user._id,
            role: user.role
          });
        })
        .catch(err => res.status(500).json({ error: err.message }));
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Login
exports.login = (req, res) => {
  return loginWithRole(req, res);
};

exports.patientLogin = (req, res) => loginWithRole(req, res, 'patient');

exports.doctorLogin = (req, res) => loginWithRole(req, res, 'doctor');

// Get current user
exports.getCurrentUser = (req, res) => {
  User.findById(req.user.userId)
    .select('-password')
    .then(user => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    })
    .catch(err => res.status(500).json({ error: err.message }));
};
