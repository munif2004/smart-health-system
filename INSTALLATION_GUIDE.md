# 🔧 Complete Installation & Setup Guide

## 📋 Step-by-Step Installation

### Part 1: Backend Setup (Node.js + Express + MongoDB)

#### 1.1 Navigate to Backend Directory
```bash
cd "C:\Users\hp\OneDrive\Desktop\ai dr\backend"
```

#### 1.2 Install Dependencies
```bash
npm install
```

This installs:
- `express` - Web framework
- `mongoose` - MongoDB ORM
- `jsonwebtoken` - JWT auth
- `bcryptjs` - Password hashing
- `axios` - HTTP client
- `socket.io` - Real-time communication
- `pdfkit` - PDF generation
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `nodemon` - Auto-restart (dev only)

#### 1.3 Setup MongoDB

**Option A: Local MongoDB**
```bash
# Windows - If MongoDB is installed
net start MongoDB

# Verify connection
mongosh mongodb://localhost:27017
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `MONGODB_URI` in `.env`

#### 1.4 Configure Environment Variables
```bash
# Create .env file (already exists, but verify)
cat backend/.env

# If not exists, create with these values:
MONGODB_URI=mongodb://localhost:27017/hospital-ai
JWT_SECRET=your_jwt_secret_key_here_change_in_production
PORT=5000
NODE_ENV=development
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
AI_MODEL_NAME=gpt2
AI_CONFIDENCE_THRESHOLD=0.7
SOCKET_CORS=http://localhost:3000
```

#### 1.5 Start Backend Server
```bash
# Development mode with auto-restart
npm run dev

# OR production mode
npm start
```

**Expected Output:**
```
✓ MongoDB Connected
🚀 Server running on port 5000
📡 Socket.io active on ws://localhost:5000
```

---

### Part 2: Frontend Setup (React)

#### 2.1 Navigate to Frontend Directory
```bash
cd "C:\Users\hp\OneDrive\Desktop\ai dr\frontend"
```

#### 2.2 Install Dependencies
```bash
npm install
```

This installs:
- `react` + `react-dom` - UI library
- `axios` - HTTP client
- `socket.io-client` - Real-time client
- `recharts` - Charting library
- `react-router-dom` - Routing
- `react-toastify` - Notifications
- `react-icons` - Icon library

#### 2.3 Verify API Configuration
```bash
# Check frontend/src/utils/api.js
# API_BASE_URL should be: http://localhost:5000/api

# This file already has correct settings
cat src/utils/api.js
```

#### 2.4 Start Frontend Server
```bash
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view hospital-ai-frontend in the browser.
Local: http://localhost:3000
```

---

## 🗄️ Database Initial Setup

### Create Admin User (One-time)

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/hospital-ai

# Add admin user
db.users.insertOne({
  "name": "Admin",
  "email": "admin@hospital.ai",
  "password": "$2a$10$...", // Use bcrypt hashed password
  "role": "admin",
  "createdAt": new Date()
})

# OR use the API endpoint
POST http://localhost:5000/api/auth/register
{
  "name": "Admin",
  "email": "admin@hospital.ai",
  "password": "Admin@123",
  "role": "admin"
}
```

### Create Sample Doctor

```bash
POST http://localhost:5000/api/auth/register
{
  "name": "Dr. John Cardiology",
  "email": "doctor.john@hospital.ai",
  "password": "Doctor@123",
  "role": "doctor",
  "specialization": "Cardiology"
}
```

### Create Sample Patient

```bash
POST http://localhost:5000/api/auth/register
{
  "name": "John Patient",
  "email": "patient@hospital.ai",
  "password": "Patient@123",
  "role": "patient"
}
```

---

## 🚀 Quick Start Commands

### Terminal 1 (Backend)
```bash
cd backend
npm run dev
```

### Terminal 2 (Frontend)
```bash
cd frontend
npm start
```

### Terminal 3 (MongoDB - if local)
```bash
mongosh
```

---

## ✅ Verification Checklist

- [ ] Backend running on `http://localhost:5000`
- [ ] Frontend running on `http://localhost:3000`
- [ ] MongoDB connected and accessible
- [ ] Socket.io connected (check browser console)
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Dashboard loads without errors
- [ ] AI symptom checker responds
- [ ] Notifications appear in real-time

---

## 🔌 Testing API Endpoints

### Using Postman or cURL

#### 1. Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "Test@123",
    "role": "patient"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test@123"
  }'
```

#### 3. Check Symptoms
```bash
curl -X POST http://localhost:5000/api/ai/symptom-check \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["chest pain", "breathing issue"]
  }'
```

#### 4. Get Dashboard Analytics
```bash
curl -X GET http://localhost:5000/api/dashboard/advanced \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "MongoDB connection refused"
```bash
# Solution: Start MongoDB
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Issue 2: "Port 5000 already in use"
```bash
# Solution: Kill process on port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Issue 3: "npm install fails"
```bash
# Solution: Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue 4: "CORS error in browser console"
```bash
# Solution: Make sure backend CORS is configured
# Check backend/server.js has:
app.use(cors());
```

### Issue 5: "Socket.io not connecting"
```bash
# Solution: Check socket service is initialized
// In frontend/src/utils/socket.js
socketService.connect()

// Check browser console for connection logs
```

---

## 📦 Production Deployment

### Building Frontend for Production
```bash
cd frontend
npm run build

# Creates optimized build in 'build' folder
# Ready for deployment to Vercel, Netlify, etc.
```

### Building Backend for Production
```bash
cd backend

# Update .env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_super_secret_key

# Deploy to Heroku, Railway, DigitalOcean, etc.
```

---

## 📚 Useful Commands Reference

```bash
# Backend
npm run dev           # Start with nodemon
npm start             # Start normally
npm test              # Run tests (if setup)

# Frontend
npm start             # Start dev server
npm run build         # Create production build
npm test              # Run tests
npm run eject         # Eject from create-react-app (⚠️ irreversible)

# MongoDB
mongosh               # Connect to MongoDB
db.version()          # Check version
db.listCollections()  # List all collections
db.users.find()       # View all users
```

---

## 🎯 Next Steps

1. ✅ Complete installation
2. ✅ Verify all services running
3. ✅ Test sample user creation
4. ✅ Test API endpoints
5. ✅ Explore dashboard features
6. ✅ Test symptom checker
7. ✅ Test appointment booking
8. ✅ Check real-time notifications
9. ✅ Generate PDF reports
10. ✅ Test voice input (modern browsers only)

---

## 💡 Pro Tips

- Use **Postman** or **Insomnia** for API testing
- Use **MongoDB Compass** for database visualization
- Use **VS Code Debugger** for step-through debugging
- Enable **Redux DevTools** extension for state management
- Keep **Backend server** running in separate terminal
- Use **npm run dev** for automatic server restart on changes
- Check **browser console** (F12) for frontend errors
- Check **terminal console** for backend errors

---

## 📞 Support Resources

- MongoDB Docs: https://docs.mongodb.com/
- Express Docs: https://expressjs.com/
- React Docs: https://react.dev/
- Socket.io Docs: https://socket.io/docs/
- Axios Docs: https://axios-http.com/

---

**Everything is ready! You can now start developing and exploring the Hospital AI System! 🚀**
