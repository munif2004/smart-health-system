# 🔧 API Error Fixes & Setup Guide

## 🎯 Issue Summary

You're seeing these errors:
- ❌ "Error loading doctors"
- ❌ "Error processing quick button"
- ❌ "Failed to load analytics"
- ❌ "Error loading reports"

**Cause**: Backend API is not returning data (likely missing test data or backend not running properly)

---

## ✅ Step 1: Verify Backend is Running

### Check Backend Status
```powershell
# Open browser and visit:
http://localhost:5000/api/health

# You should see:
{
  "status": "✓ Server is running",
  "timestamp": "2026-05-08T..."
}
```

If this shows an error:
```bash
# In backend terminal, make sure you're running:
npm run dev
# OR
node server.js
```

---

## ✅ Step 2: Create Test Data

### 2A. Create Test Doctor (MongoDB)

```bash
# Open MongoDB Shell
mongosh mongodb+srv://munif:munif%4030@cluster0.vcy6e.mongodb.net/hospital-ai

# Create a doctor
db.users.insertOne({
  name: "Dr. John - Neurology",
  email: "doctor.john@hospital.ai",
  password: "$2a$10$...",  // Use bcrypt hashed password
  role: "doctor",
  specialization: "Neurology",
  isAvailable: true,
  workload: 0,
  averageRating: 4.8,
  createdAt: new Date()
})

# Create another doctor
db.users.insertOne({
  name: "Dr. Sarah - Cardiology",
  email: "doctor.sarah@hospital.ai",
  password: "$2a$10$...",
  role: "doctor",
  specialization: "Cardiology",
  isAvailable: true,
  workload: 2,
  averageRating: 4.9,
  createdAt: new Date()
})
```

### 2B. Create Via API (Recommended)

Use Postman or curl to create doctors:

```bash
# Register as Doctor
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Dr. John Neurologist",
  "email": "doctor.john@example.com",
  "password": "Doctor@123",
  "role": "doctor"
}

# Then update specialization (as admin)
PUT http://localhost:5000/api/users/doctor/specialization
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "doctorId": "<doctor_id_from_above>",
  "specialization": "Neurology"
}
```

### 2C: Simplest Way - Use Frontend API

```javascript
// Open browser console (F12)
// In Application tab, check localStorage for 'token'

// If admin, run in console:
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Dr. Emily Cardiology",
    email: "dr.emily@hospital.ai",
    password: "DocPass@123",
    role: "doctor"
  })
}).then(r => r.json()).then(console.log)
```

---

## ✅ Step 3: Verify Data in Database

```bash
# Connect to MongoDB
mongosh "mongodb+srv://munif:munif%4030@cluster0.vcy6e.mongodb.net/hospital-ai"

# Check collections
show collections

# Count doctors
db.users.countDocuments({ role: "doctor" })

# View all doctors
db.users.find({ role: "doctor" }).pretty()

# View all users
db.users.find().pretty()
```

---

## ✅ Step 4: Test API Endpoints

### Test with Postman or cURL

```bash
# 1. Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@hospital.ai","password":"Patient@123"}'

# Copy the returned token

# 2. Get all doctors (requires token)
curl -X GET http://localhost:5000/api/users/doctors/all \
  -H "Authorization: Bearer <YOUR_TOKEN_HERE>"

# 3. Get doctors by specialization
curl -X GET http://localhost:5000/api/users/doctors/specialization/Neurology \
  -H "Authorization: Bearer <YOUR_TOKEN_HERE>"

# 4. Get dashboard analytics
curl -X GET http://localhost:5000/api/dashboard/advanced \
  -H "Authorization: Bearer <YOUR_TOKEN_HERE>"
```

---

## ✅ Step 5: Debug in Browser Console

### Option 1: Check Network Requests
1. Open DevTools: **F12**
2. Click: **Network** tab
3. Reload page: **F5**
4. Look for red requests (failed API calls)
5. Click each request to see:
   - Request URL
   - Request headers (Authorization token)
   - Response (error message)

### Option 2: Check Console Logs
1. Open DevTools: **F12**
2. Click: **Console** tab
3. Look for error messages starting with "Error:", "Dashboard Error:", etc.
4. Copy full error message

### Option 3: Check Application Storage
1. Open DevTools: **F12**
2. Click: **Application** → **Local Storage** → **http://localhost:3000**
3. Check if `token` exists
4. If no token, user is not logged in (need to login first)

---

## ✅ Step 6: Common Issues & Fixes

### Issue 1: "Error loading doctors" on Booking Page

**Cause**: No doctors in database OR no doctors with matching specialization

**Fix**:
```javascript
// In browser console:
// Get your token first (check localStorage)
const token = localStorage.getItem('token');

// Test endpoint
fetch('http://localhost:5000/api/users/doctors/all', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log)
```

If response is empty `[]`, create doctors first (Step 2).

### Issue 2: "Error processing quick button" on Home

**Cause**: Chatbot API endpoint issue OR authentication problem

**Fix**:
```javascript
// Test chatbot endpoint
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/chatbot/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ message: 'Hello' })
}).then(r => r.json()).then(console.log)
```

### Issue 3: "Failed to load analytics"

**Cause**: Dashboard endpoint returning no data OR database connection issue

**Fix**:
```javascript
// Test analytics endpoint
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/dashboard/advanced', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log)
```

### Issue 4: Not Logged In (No Token)

**Solution**:
1. Click **Home** button
2. Look for login button
3. Login with valid credentials:
   ```
   Email: patient@hospital.ai
   Password: Patient@123
   
   OR (if not exists)
   Email: admin@hospital.ai
   Password: Admin@123
   ```

---

## ✅ Step 7: Fresh Start (Nuclear Option)

If nothing works, start completely fresh:

### 7A: Clear Frontend Cache
```bash
cd frontend
npm cache clean --force
rm -rf node_modules
rm package-lock.json
npm install
npm start
```

### 7B: Restart Backend
```bash
cd backend
npm install  # In case packages are missing
npm run dev
```

### 7C: Clear Database
```bash
# In MongoDB
mongosh "mongodb+srv://munif:munif%4030@cluster0.vcy6e.mongodb.net/hospital-ai"

# Drop entire database (careful!)
db.dropDatabase()

# OR just drop collections
db.users.deleteMany({})
db.appointments.deleteMany({})
db.notifications.deleteMany({})

# Start fresh with Step 2 (Create Test Data)
```

---

## ✅ Step 8: Verify Everything Works

### Checklist:
- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] GET http://localhost:5000/api/health returns success
- [ ] At least 2 doctors exist in database
- [ ] User is logged in (token in localStorage)
- [ ] Network tab shows successful API responses (200, not errors)
- [ ] Browser console has no red error messages
- [ ] Page shows data without error toasts

---

## 📊 Expected Results After Fix

### Home Page
- ✅ "Welcome, [name]!" greeting
- ✅ Chatbot shows quick buttons (no errors)
- ✅ Voice input working
- ✅ No error toasts

### Appointment Booking
- ✅ Step 1: Analyze symptoms
- ✅ Step 2: Shows list of doctors (not empty)
- ✅ Can select doctor
- ✅ Can book appointment

### Analytics
- ✅ Dashboard loads with cards
- ✅ Charts display
- ✅ No "Failed to load analytics" error

### Reports
- ✅ If appointments exist: Shows list
- ✅ Download PDF button visible
- ✅ No "Error loading reports"

---

## 🚨 Emergency Checklist

If still stuck:

1. **Close everything and restart**
   ```bash
   # Terminal 1 (Backend)
   cd backend && npm run dev
   
   # Terminal 2 (Frontend)
   cd frontend && npm start
   ```

2. **Check MongoDB connection**
   ```
   MONGODB_URI in backend/.env should be:
   mongodb+srv://munif:munif%4030@cluster0.vcy6e.mongodb.net/hospital-ai
   ```

3. **Verify MongoDB has data**
   ```bash
   mongosh "mongodb+srv://munif:munif%4030@cluster0.vcy6e.mongodb.net/hospital-ai"
   db.users.count()
   # Should be > 0
   ```

4. **Check token in browser**
   - F12 → Application → Local Storage
   - Should have `token` key
   - If missing, user not logged in

5. **Clear all caches**
   ```bash
   # Frontend
   rm -rf node_modules/.cache
   
   # Browser
   F12 → Storage → Clear All
   ```

---

## 📞 Debug Information to Collect

If error persists, collect:

1. Full error message from console
2. API response from Network tab
3. Token value (first 50 chars)
4. MongoDB collection count:
   ```bash
   db.users.count()
   db.appointments.count()
   ```
5. Backend console output (last 10 lines)

---

**Your system should work perfectly once test data is created! 🚀**
