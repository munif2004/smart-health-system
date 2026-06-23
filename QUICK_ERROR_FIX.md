# 🎯 API Errors - Complete Fix Guide

## ❌ Current Errors You're Seeing

```
Error loading doctors
Error processing quick button
Failed to load analytics
Error loading reports
```

## ✅ Root Cause

**No test data in MongoDB** - The database is connected but empty (no doctors, no appointments)

---

## 🚀 Quick Fix (5 Minutes)

### Step 1: Create Test Data

**Option A: Via MongoDB Shell (Recommended - Fastest)**

```bash
# Copy-paste this entire block into mongosh terminal

mongosh "mongodb+srv://munif:munif%4030@cluster0.vcy6e.mongodb.net/hospital-ai"

# Then paste these commands:
db.users.insertMany([
  {
    name: "Dr. John Smith",
    email: "doctor.john@hospital.ai",
    password: "$2a$10$Yq.9a1zD3w8x5z6a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4",
    role: "doctor",
    specialization: "Neurology",
    isAvailable: true,
    workload: 0,
    averageRating: 4.8
  },
  {
    name: "Dr. Sarah Cardio",
    email: "doctor.sarah@hospital.ai",
    password: "$2a$10$Yq.9a1zD3w8x5z6a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4",
    role: "doctor",
    specialization: "Cardiology",
    isAvailable: true,
    workload: 0,
    averageRating: 4.9
  },
  {
    name: "Patient Test",
    email: "patient@hospital.ai",
    password: "$2a$10$Yq.9a1zD3w8x5z6a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4",
    role: "patient"
  }
])

# Verify:
db.users.count()
# Should show: 3
```

**Option B: Via Browser Console**

```javascript
// Login first, then open F12 console and paste:
const token = localStorage.getItem('token');

// Create doctor
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Dr. John",
    email: "doctor.john@test.ai",
    password: "Doctor@123",
    role: "doctor"
  })
}).then(r => r.json()).then(d => console.log("Doctor created:", d));
```

### Step 2: Reload Frontend

```
F5 or Ctrl+R in browser to refresh
```

### Step 3: Test

1. Click **"Book Appointment"**
2. Should now see doctor list (not empty)
3. Error should be gone ✅

---

## 📊 Complete Data Setup (For Full Testing)

See: **MONGODB_SETUP.md** in project root

Quick commands:
```bash
mongosh "mongodb+srv://munif:munif%4030@cluster0.vcy6e.mongodb.net/hospital-ai"

# Copy entire setup from MONGODB_SETUP.md and paste
```

---

## 🔍 Debug: Verify Backend is Responding

### Check 1: Is Backend Running?
```
Visit: http://localhost:5000/api/health

Should see:
{
  "status": "✓ Server is running",
  "timestamp": "..."
}
```

If error → Start backend:
```bash
cd backend
npm run dev
```

### Check 2: Is MongoDB Connected?
```bash
# Check backend console output
# Should see: ✓ MongoDB Connected
```

If error → Verify connection string in `.env`:
```
MONGODB_URI=mongodb+srv://munif:munif%4030@cluster0.vcy6e.mongodb.net/hospital-ai
```

### Check 3: Do Doctors Exist?
```bash
mongosh "mongodb+srv://munif:munif%4030@cluster0.vcy6e.mongodb.net/hospital-ai"
db.users.find({ role: "doctor" }).count()

# Should be > 0
```

### Check 4: Can You Fetch Doctors?
```bash
# Get your token first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@hospital.ai","password":"Patient@123"}'

# Copy the token, then:
curl -X GET http://localhost:5000/api/users/doctors/all \
  -H "Authorization: Bearer <YOUR_TOKEN>"

# Should return doctor list (not empty)
```

---

## 🔧 Advanced Debugging

### In Browser Console (F12 → Console)

```javascript
// Check if token exists
console.log("Token:", localStorage.getItem('token'));

// Test API call
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/users/doctors/all', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => {
  console.log("Status:", r.status);
  return r.json();
})
.then(data => console.log("Response:", data));
```

### In Network Tab (F12 → Network)

1. Open DevTools: **F12**
2. Click: **Network** tab
3. Do an action (e.g., click "Book Appointment")
4. Look for failed requests (red)
5. Click request to see:
   - **URL**: Should be `http://localhost:5000/api/...`
   - **Status**: Should be 200 (not 500, 401, etc)
   - **Response**: Should show data (not error)

---

## 🆘 If Still Having Issues

### 1. Clear Everything & Start Fresh

```bash
# Frontend
cd frontend
npm cache clean --force
rm -rf node_modules
npm install
npm start

# Backend (in another terminal)
cd backend
npm install
npm run dev
```

### 2. Drop Database & Recreate

```bash
mongosh "mongodb+srv://munif:munif%4030@cluster0.vcy6e.mongodb.net/hospital-ai"
db.dropDatabase()

# Then run setup from MONGODB_SETUP.md
```

### 3. Check Logs

**Backend logs** (in terminal where you ran `npm run dev`):
- Look for errors
- Should see: `✓ MongoDB Connected`
- Should see requests: `GET /api/users/doctors/all`

**Browser console** (F12):
- Look for red errors
- Copy full error message
- Paste in MongoDB_SETUP.md issue section

---

## ✅ Expected Results After Fix

### Appointment Booking Page
```
✅ Step 2: Select a Doctor
✅ Shows list of doctors (at least 2)
✅ Can select doctor
✅ No error toast
```

### Home Page
```
✅ Chatbot loads
✅ Quick buttons appear (Check Symptoms, Book Appointment, Emergency)
✅ Can click quick buttons
✅ No "Error processing quick button" toast
```

### Analytics Page
```
✅ Dashboard loads
✅ Shows charts and cards
✅ No "Failed to load analytics" error
```

### Reports Page
```
✅ Page loads
✅ If appointments exist: shows reports
✅ Can download PDF
✅ No error toast
```

---

## 📋 Checklist

- [ ] Backend running (`npm run dev` in backend/)
- [ ] Frontend running (`npm start` in frontend/)
- [ ] Test data created (at least 2 doctors)
- [ ] Can access: http://localhost:5000/api/health
- [ ] Can access: http://localhost:3000
- [ ] Logged in with patient account
- [ ] No red error toasts on pages
- [ ] Can see doctors list when booking appointment
- [ ] Network tab shows 200 status (not errors)

---

## 🎉 Success!

Once all checkboxes are ✅, your app should:
- ✅ Load all pages without errors
- ✅ Display doctors in appointment booking
- ✅ Show analytics dashboard
- ✅ Show reports (if appointments exist)
- ✅ Process chatbot quick buttons
- ✅ Work with voice input

---

## 📞 Still Stuck?

Collect this info and review:

1. **Backend running?**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Doctors in DB?**
   ```bash
   mongosh ... 
   db.users.count()
   # Should be > 0
   ```

3. **Can fetch doctors?**
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:5000/api/users/doctors/all
   ```

4. **Browser console error** (F12)
   - Copy full error message

5. **Network tab error** (F12 → Network)
   - Click failed request
   - Copy Response tab

Then refer to **API_ERRORS_FIX_GUIDE.md** in project root for detailed debugging steps.

---

**Most Common Fix: Just create test data in MongoDB and reload page!** 🚀
