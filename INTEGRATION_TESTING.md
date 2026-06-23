# 🔗 Integration Testing & Deployment Guide

## Part 1: Integration Testing

### Pre-Testing Checklist
- [ ] MongoDB running and accessible
- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] No console errors in browser
- [ ] No console errors in terminal

---

## 📋 Complete Testing Scenario

### Test 1: User Registration & Authentication

**Steps:**
```bash
# Terminal: cURL or Postman
POST http://localhost:5000/api/auth/register
Header: Content-Type: application/json
Body: {
  "name": "Test Patient",
  "email": "patient@test.com",
  "password": "Test@123",
  "role": "patient"
}
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "patient@test.com",
    "role": "patient"
  }
}
```

**Verification:**
- [ ] Status code: 201 (Created)
- [ ] User can login with same credentials
- [ ] MongoDB has user document

---

### Test 2: AI Symptom Checker

**Steps:**
```bash
# First login to get JWT token
POST http://localhost:5000/api/auth/login
{
  "email": "patient@test.com",
  "password": "Test@123"
}

# Save the returned token, then:
POST http://localhost:5000/api/ai/symptom-check
Header: Authorization: Bearer <TOKEN>
Body: {
  "symptoms": ["chest pain", "breathing issue", "sweating"]
}
```

**Expected Response:**
```json
{
  "prediction": {
    "disease": "Cardiac Issues",
    "confidence": 85,
    "severity": "Critical",
    "recommendedDepartment": "Cardiology",
    "isEmergency": true,
    "suggestedActions": [...]
  }
}
```

**Verification:**
- [ ] Confidence is between 0-100
- [ ] Severity is one of: Low, Medium, Critical
- [ ] IsEmergency is boolean
- [ ] Recommended department is valid specialty
- [ ] Suggestions are meaningful

---

### Test 3: Auto-Appointment Booking

**Prerequisites:**
- [ ] Doctor exists with matching specialization
- [ ] Doctor is available (isAvailable = true)

**Steps:**
```bash
POST http://localhost:5000/api/ai/auto-book
Header: Authorization: Bearer <PATIENT_TOKEN>
Body: {
  "symptoms": ["chest pain"]
}
```

**Expected Response:**
```json
{
  "appointment": {
    "appointmentId": "...",
    "patientId": "...",
    "doctorId": "...",
    "doctorName": "Dr. John",
    "specialization": "Cardiology",
    "appointmentDate": "2024-01-15",
    "appointmentTime": "10:00 AM",
    "symptoms": ["chest pain"],
    "aiPrediction": {...},
    "status": "scheduled"
  },
  "message": "Appointment booked successfully"
}
```

**Verification:**
- [ ] Doctor specialization matches recommended department
- [ ] Doctor status is available
- [ ] Appointment date is in future
- [ ] Status is "scheduled"
- [ ] Doctor workload incremented by 1
- [ ] Socket.io notification sent to doctor

---

### Test 4: Real-time Notifications (Multi-client Test)

**Setup:**
- [ ] Open 2 browser windows
- [ ] Window 1: Login as Doctor
- [ ] Window 2: Login as Patient

**Steps - Window 2:**
```javascript
// Book appointment (from Test 3)
// Should see notification in Window 1 instantly
```

**Steps - Window 1 (Doctor):**
```javascript
// Check browser console or notification area
// Should see: "New appointment from [patient name]"
```

**Verification:**
- [ ] Notification appears in < 1 second
- [ ] Notification has appointment details
- [ ] Notification dismiss button works
- [ ] Multiple notifications stack properly
- [ ] Browser DevTools shows Socket.io message

---

### Test 5: Appointment Status Update

**Steps:**
```bash
# Doctor updates appointment to "in-progress"
PUT http://localhost:5000/api/appointments/<appointmentId>/status
Header: Authorization: Bearer <DOCTOR_TOKEN>
Body: {
  "status": "in-progress"
}
```

**Expected Response:**
```json
{
  "message": "Appointment status updated",
  "appointment": {
    "status": "in-progress",
    "updatedAt": "..."
  }
}
```

**Verification:**
- [ ] Status changed in database
- [ ] Patient receives real-time notification
- [ ] Notification says: "Your appointment has started"
- [ ] Frontend updates appointment list automatically

---

### Test 6: Appointment Rating

**Steps:**
```bash
PUT http://localhost:5000/api/appointments/<appointmentId>/rate
Header: Authorization: Bearer <PATIENT_TOKEN>
Body: {
  "rating": 5,
  "feedback": "Excellent doctor!"
}
```

**Expected Response:**
```json
{
  "message": "Appointment rated successfully",
  "updatedRating": 4.8
}
```

**Verification:**
- [ ] Rating stored (1-5 stars)
- [ ] Feedback stored
- [ ] Doctor's average rating updated
- [ ] Rating persists in database

---

### Test 7: Dashboard Analytics

**Steps:**
```bash
GET http://localhost:5000/api/dashboard/advanced
Header: Authorization: Bearer <ADMIN_TOKEN>
```

**Expected Response:**
```json
{
  "summary": {
    "totalAppointments": 10,
    "appointmentsToday": 2,
    "emergencyCount": 1,
    "totalPatients": 5,
    "totalDoctors": 3,
    "averageRating": 4.5
  },
  "mostCommonDiseases": [
    { "disease": "Cardiac Issues", "count": 3 },
    ...
  ],
  "departmentStats": [...],
  "doctorWorkload": [...],
  "chartData": {
    "appointmentsPerDay": [...],
    "diseaseBreakdown": [...],
    "departmentBreakdown": [...]
  }
}
```

**Verification:**
- [ ] All metrics are numbers
- [ ] Arrays are properly formatted
- [ ] Chart data is in Recharts format
- [ ] Response time < 500ms (10 queries)
- [ ] No null/undefined values

---

### Test 8: PDF Report Generation

**Steps:**
```bash
GET http://localhost:5000/api/reports/<appointmentId>/download
Header: Authorization: Bearer <PATIENT_TOKEN>
```

**Expected Response:**
- File download starts automatically
- Filename: `medical-report-<appointmentId>.pdf`

**Verification:**
- [ ] PDF file downloads without error
- [ ] File size > 50KB
- [ ] PDF opens in default reader
- [ ] PDF contains all sections:
  - [ ] Hospital header
  - [ ] Patient information
  - [ ] Doctor information
  - [ ] Symptoms list
  - [ ] AI prediction
  - [ ] Severity badge
  - [ ] Recommendations

---

### Test 9: Chatbot Conversation

**Steps:**
```bash
POST http://localhost:5000/api/chatbot/chat
Header: Authorization: Bearer <USER_TOKEN>
Body: {
  "message": "Check my symptoms"
}
```

**Expected Response:**
```json
{
  "role": "assistant",
  "message": "Please describe your symptoms in detail.",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Verification:**
- [ ] Response is contextual
- [ ] Timestamp is correct
- [ ] Message stored in database
- [ ] Conversation history retrieved: `GET /api/chatbot/history`

---

### Test 10: Emergency Alert Flow

**Steps:**
```bash
POST http://localhost:5000/api/ai/symptom-check
Body: {
  "symptoms": ["chest pain", "breathing issue", "unconscious"]
}
```

**Expected Response:**
```json
{
  "prediction": {
    "isEmergency": true,
    "severity": "Critical",
    ...
  }
}
```

**Frontend Verification:**
- [ ] Red overlay appears
- [ ] Blinking emergency banner visible
- [ ] "Call 911" button prominent
- [ ] Background blurred
- [ ] Close button works

**Backend Verification:**
- [ ] Appointment created with isEmergency = true
- [ ] Notification created with type = "emergency"
- [ ] Socket.io emergency event sent

---

## 🧪 Test Execution in Postman

### Step 1: Create Collection
1. Open Postman
2. New → Collection → "Hospital AI Tests"

### Step 2: Add All Endpoints
```
1. POST /auth/register
2. POST /auth/login
3. POST /ai/symptom-check
4. POST /ai/auto-book
5. GET /dashboard/advanced
6. PUT /appointments/:id/status
7. GET /reports/:id/download
8. POST /chatbot/chat
9. ... (add all 25+ endpoints)
```

### Step 3: Set Environment Variables
```
{
  "base_url": "http://localhost:5000/api",
  "auth_token": "<JWT token>",
  "patient_id": "<patient_id>",
  "doctor_id": "<doctor_id>",
  "appointment_id": "<appointment_id>"
}
```

### Step 4: Run Collection
- Collections → Hospital AI Tests → Run

---

## 📊 Performance Testing

### Response Time Targets
```
GET /appointments           < 100ms
POST /ai/symptom-check      < 200ms
GET /dashboard/advanced     < 500ms (10 queries)
GET /reports/download       < 2000ms (PDF generation)
POST /auth/login            < 150ms
Socket.io message           < 100ms
```

### Load Testing
```bash
# Using Apache Bench
ab -n 100 -c 10 http://localhost:5000/api/auth/me

# Using wrk
wrk -t4 -c100 -d30s \
  -s script.lua \
  http://localhost:5000/api/dashboard/advanced
```

---

## 🐛 Troubleshooting Integration Issues

### Issue: CORS Error
```
Access-Control-Allow-Origin not allowed
```
**Solution:**
```javascript
// backend/server.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Issue: JWT Token Expired
```
Error: Token expired
```
**Solution:**
```bash
# Get new token by logging in again
POST /api/auth/login
```

### Issue: Socket.io Not Connecting
```
Socket connection timeout
```
**Solution:**
```javascript
// Verify SOCKET_CORS in .env
SOCKET_CORS=http://localhost:3000

// Check browser console for warnings
// Restart both servers
```

### Issue: Appointment Auto-Book Fails
```
Error: No available doctors
```
**Solution:**
```bash
# Create a doctor with matching specialization
POST /api/auth/register
{
  "role": "doctor",
  "specialization": "Cardiology",
  "isAvailable": true
}
```

### Issue: PDF Download Fails
```
Error: PDF generation failed
```
**Solution:**
```bash
# Check temp directory permissions
# Verify pdfkit is installed
npm install pdfkit

# Check appointment exists
GET /api/appointments/<id>
```

---

## 🚀 Deployment Preparation

### Step 1: Production Build (Frontend)
```bash
cd frontend
npm run build

# Creates optimized build in 'build' folder
# Size should be < 2MB (gzipped)
```

### Step 2: Update Environment Variables

**Backend (.env)**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hospital-ai
JWT_SECRET=your_super_secure_random_key_change_this_immediately
PORT=5000
HUGGINGFACE_API_KEY=your_api_key
SOCKET_CORS=https://your-frontend-domain.com
```

**Frontend (.env)**
```
REACT_APP_API_URL=https://your-backend-domain.com/api
```

### Step 3: Heroku Deployment (Backend)

```bash
# Login
heroku login

# Create app
heroku create your-hospital-api

# Add MongoDB add-on
heroku addons:create mongolab

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

### Step 4: Vercel Deployment (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod

# Follow prompts
```

### Step 5: Configure DNS (Optional)
```
Point your domain to Heroku & Vercel
Set up SSL certificates
Configure custom domains
```

---

## ✅ Pre-Production Checklist

- [ ] All tests passing
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Error handling comprehensive
- [ ] Database indexes created
- [ ] Environment variables secure
- [ ] Rate limiting implemented
- [ ] HTTPS enabled
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Rollback plan ready
- [ ] Documentation complete

---

## 📞 Support & Debugging

### Enable Debug Logging
```javascript
// backend: server.js
const debug = require('debug')('hospital-ai');
debug('Server starting...');

// frontend: App.jsx
console.log('Component mounted');
```

### Monitor Database
```bash
mongosh mongodb://localhost:27017/hospital-ai

# View collections
show collections

# View document count
db.users.count()
db.appointments.count()

# Monitor queries
db.setProfileLevel(1)
db.system.profile.find().limit(5).sort({ ts : -1 }).pretty()
```

### Check API Logs
```bash
# Backend terminal
tail -f server.log

# See Socket.io events
socket.io events in console
```

---

## 🎯 Final Verification

1. ✅ All endpoints respond correctly
2. ✅ Real-time notifications work
3. ✅ PDF generation successful
4. ✅ Database queries optimized
5. ✅ Security measures in place
6. ✅ Error handling complete
7. ✅ Performance acceptable
8. ✅ Ready for production

---

**System is production-ready! 🚀**
