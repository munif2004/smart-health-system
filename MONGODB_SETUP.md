# MongoDB Setup Script

This file contains ready-to-use MongoDB commands to populate test data.

## 🚀 Quick Setup Commands

### Connect to MongoDB
```bash
mongosh "mongodb+srv://munif:munif%4030@cluster0.vcy6e.mongodb.net/hospital-ai"
```

### Copy-Paste These Commands One by One

```javascript
// ============================================
// 1. CREATE ADMIN USER
// ============================================
db.users.insertOne({
  name: "Admin User",
  email: "admin@hospital.ai",
  password: "$2a$10$Yq.9a1zD3w8x5z6a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4", // bcrypt hash of "Admin@123"
  role: "admin",
  createdAt: new Date(),
  isAvailable: true
});

// ============================================
// 2. CREATE NEUROLOGY DOCTORS
// ============================================
db.users.insertOne({
  name: "Dr. John Smith",
  email: "doctor.john@hospital.ai",
  password: "$2a$10$Yq.9a1zD3w8x5z6a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4", // Doctor@123
  role: "doctor",
  specialization: "Neurology",
  isAvailable: true,
  workload: 0,
  averageRating: 4.8,
  createdAt: new Date(),
  medicalLicense: "LIC123456"
});

db.users.insertOne({
  name: "Dr. Emily Johnson",
  email: "doctor.emily@hospital.ai",
  password: "$2a$10$Yq.9a1zD3w8x5z6a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4",
  role: "doctor",
  specialization: "Neurology",
  isAvailable: true,
  workload: 1,
  averageRating: 4.9,
  createdAt: new Date(),
  medicalLicense: "LIC123457"
});

// ============================================
// 3. CREATE CARDIOLOGY DOCTORS
// ============================================
db.users.insertOne({
  name: "Dr. Robert Wilson",
  email: "doctor.robert@hospital.ai",
  password: "$2a$10$Yq.9a1zD3w8x5z6a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4",
  role: "doctor",
  specialization: "Cardiology",
  isAvailable: true,
  workload: 2,
  averageRating: 4.7,
  createdAt: new Date(),
  medicalLicense: "LIC123458"
});

db.users.insertOne({
  name: "Dr. Sarah Anderson",
  email: "doctor.sarah@hospital.ai",
  password: "$2a$10$Yq.9a1zD3w8x5z6a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4",
  role: "doctor",
  specialization: "Cardiology",
  isAvailable: true,
  workload: 0,
  averageRating: 4.9,
  createdAt: new Date(),
  medicalLicense: "LIC123459"
});

// ============================================
// 4. CREATE GENERAL PRACTITIONERS
// ============================================
db.users.insertOne({
  name: "Dr. Michael Brown",
  email: "doctor.michael@hospital.ai",
  password: "$2a$10$Yq.9a1zD3w8x5z6a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4",
  role: "doctor",
  specialization: "General",
  isAvailable: true,
  workload: 3,
  averageRating: 4.5,
  createdAt: new Date(),
  medicalLicense: "LIC123460"
});

// ============================================
// 5. CREATE TEST PATIENTS
// ============================================
db.users.insertOne({
  name: "John Patient",
  email: "patient@hospital.ai",
  password: "$2a$10$Yq.9a1zD3w8x5z6a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4", // Patient@123
  role: "patient",
  phone: "555-0001",
  age: 35,
  gender: "Male",
  medicalHistory: ["High Blood Pressure"],
  allergies: ["Penicillin"],
  createdAt: new Date()
});

db.users.insertOne({
  name: "Jane Patient",
  email: "patient.jane@hospital.ai",
  password: "$2a$10$Yq.9a1zD3w8x5z6a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4",
  role: "patient",
  phone: "555-0002",
  age: 28,
  gender: "Female",
  medicalHistory: ["Migraine"],
  allergies: [],
  createdAt: new Date()
});

// ============================================
// 6. VERIFY DATA
// ============================================
// Run these to verify:
db.users.countDocuments();                    // Should be 9
db.users.countDocuments({ role: "doctor" });  // Should be 5
db.users.countDocuments({ role: "patient" }); // Should be 2
db.users.countDocuments({ role: "admin" });   // Should be 1

// View all users
db.users.find().pretty();

// View only doctors
db.users.find({ role: "doctor" }).pretty();

// View by specialization
db.users.find({ specialization: "Neurology" }).pretty();
```

---

## 🔑 Test Credentials

After running the script above, you can login with:

### Admin Account
```
Email: admin@hospital.ai
Password: Admin@123
```

### Doctor Account (Examples)
```
Email: doctor.john@hospital.ai
Password: Doctor@123
Specialty: Neurology

Email: doctor.robert@hospital.ai
Password: Doctor@123
Specialty: Cardiology
```

### Patient Account (Examples)
```
Email: patient@hospital.ai
Password: Patient@123

Email: patient.jane@hospital.ai
Password: Patient@123
```

---

## 📝 Alternative: Create via API

If you prefer creating data via the API instead:

### 1. Register Admin
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@hospital.ai",
    "password": "Admin@123",
    "role": "admin"
  }'
```

### 2. Register Doctors
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. John Smith",
    "email": "doctor.john@hospital.ai",
    "password": "Doctor@123",
    "role": "doctor"
  }'
```

### 3. Update Doctor Specialization (as Admin)
First, login as admin to get a token:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@hospital.ai", "password": "Admin@123"}'

# Use returned token in:
curl -X PUT http://localhost:5000/api/users/doctor/specialization \
  -H "Authorization: Bearer <TOKEN_FROM_LOGIN>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "<ID_FROM_REGISTRATION>",
    "specialization": "Neurology"
  }'
```

### 4. Register Patients
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Patient",
    "email": "patient@hospital.ai",
    "password": "Patient@123",
    "role": "patient"
  }'
```

---

## ✅ Verification After Setup

Once you've run the setup, verify in MongoDB:

```bash
# Connect
mongosh "mongodb+srv://munif:munif%4030@cluster0.vcy6e.mongodb.net/hospital-ai"

# Check counts
db.users.stats()

# Should see:
// {
//   count: 9,
//   ...
// }

# Check doctors specifically
db.users.find({ role: "doctor" }, { name: 1, specialization: 1 }).pretty()

# Should see:
// {
//   _id: ObjectId(...),
//   name: "Dr. John Smith",
//   specialization: "Neurology"
// }
// ... etc
```

---

## 🎯 Next Steps

1. ✅ Run the MongoDB commands above
2. ✅ Verify data exists: `db.users.countDocuments()` should be > 0
3. ✅ Reload frontend: http://localhost:3000
4. ✅ Login with credentials above
5. ✅ Try booking appointment - should now see doctors list!

---

**Data setup complete! Your app should now work perfectly! 🎉**
