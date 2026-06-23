# ⚡ Quick Start Guide (5 Minutes)

## 🚀 Get Running in 5 Minutes

### Step 1: Open Two Terminals

**Terminal 1 (Backend)**
```bash
cd "C:\Users\hp\OneDrive\Desktop\ai dr\backend"
npm install
npm run dev
```

**Terminal 2 (Frontend)**
```bash
cd "C:\Users\hp\OneDrive\Desktop\ai dr\frontend"
npm install
npm start
```

---

## ✅ You Should See:

### Terminal 1:
```
✓ MongoDB Connected
🚀 Server running on port 5000
📡 Socket.io active on ws://localhost:5000
```

### Terminal 2:
```
Compiled successfully!

You can now view hospital-ai-frontend in the browser.
Local: http://localhost:3000
```

### Browser (http://localhost:3000):
```
🏥 Hospital AI System
[Chatbot Window] [Voice Input]
[Navigation: Symptoms | Dashboard | Reports]
```

---

## 🧪 Quick Test (2 Minutes)

### Step 1: Create Account
```
Email: test@test.com
Password: Test@123
Role: Patient
```

### Step 2: Test Symptom Checker
```
Input: "chest pain, breathing issue"
Expected: 
  - Disease: Cardiac Issues
  - Confidence: 85%
  - Severity: Critical 🚨
  - Auto-appointment booked
```

### Step 3: Check Notifications
```
- Bell icon should show badge
- Click to see appointment notification
- Should be real-time (Socket.io)
```

### Step 4: View Analytics
```
- Create another account as doctor
- Admin account sees dashboard
- Charts should load with data
```

### Step 5: Download Report
```
- Go to Reports section
- Click Download PDF
- File appears: medical-report-{id}.pdf
```

---

## 🎯 One-Command Setup

If you want just one command to start everything:

```bash
# From project root
cd backend && npm install && npm run dev &
cd ../frontend && npm install && npm start
```

---

## 🔑 Test Credentials

### Predefined Admin
```
Email: admin@hospital.ai
Password: Admin@123
Role: admin
```

### Predefined Doctor
```
Email: doctor.john@hospital.ai
Password: Doctor@123
Role: doctor
Specialization: Cardiology
```

### Predefined Patient
```
Email: patient@hospital.ai
Password: Patient@123
Role: patient
```

---

## 🐛 Common Issues (Quick Fixes)

### "MongoDB connection refused"
```bash
# Start MongoDB
net start MongoDB  # Windows
# OR download MongoDB Community Edition
```

### "Port 5000 already in use"
```bash
# Kill process
taskkill /F /IM node.exe

# Change port in backend/.env
PORT=5001
```

### "npm install fails"
```bash
# Clear cache
npm cache clean --force

# Reinstall
npm install
```

### "CORS error"
```javascript
// Already configured in backend/server.js
// If issue persists, check:
SOCKET_CORS=http://localhost:3000 (in .env)
```

---

## 📌 Key Endpoints for Testing

### With Postman/Thunder Client:

```
POST http://localhost:5000/api/auth/register
{
  "name": "Test User",
  "email": "user@test.com",
  "password": "Password123",
  "role": "patient"
}

POST http://localhost:5000/api/auth/login
{
  "email": "user@test.com",
  "password": "Password123"
}

POST http://localhost:5000/api/ai/symptom-check
{
  "symptoms": ["chest pain", "breathing issue"]
}

GET http://localhost:5000/api/dashboard/advanced
(Header: Authorization: Bearer YOUR_JWT_TOKEN)
```

---

## 🎬 Demo Sequence (3 Minutes)

1. **Open app**: http://localhost:3000
2. **Register**: Create new account
3. **Check Symptoms**: Type "chest pain"
4. **See AI Result**: Prediction with confidence
5. **Auto-book**: Appointment auto-created
6. **Get Notification**: Real-time toast appears
7. **Download Report**: PDF generated
8. **View Dashboard**: Charts and analytics

---

## 📂 File Structure Quick Reference

```
ai-hospital-system/
├── backend/
│   ├── models/         ← Database schemas
│   ├── controllers/    ← Business logic
│   ├── routes/         ← API endpoints
│   ├── utils/          ← Helper functions
│   ├── server.js       ← Main entry
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ ← React components
│   │   ├── utils/      ← API & Socket
│   │   └── App.jsx     ← Main app
│   └── package.json
├── README.md           ← Full documentation
├── INSTALLATION_GUIDE.md
├── FEATURES_GUIDE.md
├── VIVA_EXPLANATION.md
└── This file
```

---

## 🚀 Next Steps After Quick Start

1. ✅ Verify all 8 features working
2. ✅ Test with multiple users
3. ✅ Check real-time notifications
4. ✅ Generate and download PDF
5. ✅ Test voice input
6. ✅ View analytics dashboard
7. ✅ Test emergency alert
8. ✅ Prepare for viva demonstration

---

## 💡 Pro Tips

- Use **F12** to open browser DevTools
- Check **Console** for JavaScript errors
- Check **Network** tab for API calls
- Use **Terminal 3** to monitor MongoDB:
  ```bash
  mongosh mongodb://localhost:27017/hospital-ai
  ```
- Keep servers running while developing
- Use **nodemon** (auto-restarts server on file changes)

---

## 📞 Need Help?

1. Check terminal for error messages
2. Check browser console (F12)
3. Check MongoDB connection
4. Review README.md for full docs
5. Check VIVA_EXPLANATION.md for architecture

---

**Now you're ready! Start the servers and explore! 🎉**
