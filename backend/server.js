const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const fileUpload = require('express-fileupload');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const VideoCall = require('./models/VideoCall');
const Consultation = require('./models/Consultation');
require('dotenv').config();

const app = express();
const server = http.createServer(app);




const allowedOrigin = [
  "https://aismart-health-system.netlify.app/",
  process.env.CLIENT_URL,
  process.env.SOCKET_CORS,
  "http://localhost:3000"
];



console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("SOCKET_CORS:", process.env.SOCKET_CORS);
console.log("allowedOrigin:", allowedOrigin);



const io = socketIO(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), fullscreen=(self)');
  next();
};

const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 600 } = {}) => {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt < now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    hits.set(key, bucket);

    if (bucket.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    next();
  };
};



app.use(cors({
  origin: true,
  credentials: true
})); 
app.use(securityHeaders);
app.use(createRateLimiter());
app.use(express.json({ limit: '2mb' }));
app.use(fileUpload());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-ai')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err.message));

app.set('io', io);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/search', require('./routes/search'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/consultations', require('./routes/consultations'));

app.get('/', (req, res) => {
  res.send('Hospital AI Backend Running');
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', async () => {
    if (socket.data?.consultationRoomId) {
      socket.to(socket.data.consultationRoomId).emit('consultation-user-left', {
        userId: socket.data.userId,
        role: socket.data.role
      });
      await Consultation.updateOne(
        { roomId: socket.data.consultationRoomId, 'participants.socketId': socket.id },
        { $set: { 'participants.$.leftAt': new Date() } }
      ).catch(() => {});
    }
    console.log('User disconnected:', socket.id);
  });

  socket.on('doctor-login', (doctorId) => {
    socket.join(`doctor-${doctorId}`);
    socket.join(`user-${doctorId}`);
    socket.broadcast.emit('doctor-online', { doctorId, online: true });
    console.log(`Doctor ${doctorId} is online`);
  });

  socket.on('patient-login', (patientId) => {
    socket.join(`patient-${patientId}`);
    socket.join(`user-${patientId}`);
    console.log(`Patient ${patientId} is online`);
  });

  socket.on('join-user', ({ userId, role }) => {
    if (!userId) return;
    socket.join(`user-${userId}`);
    if (role === 'doctor') socket.join(`doctor-${userId}`);
    if (role === 'patient') socket.join(`patient-${userId}`);
    socket.emit('user-joined', { userId, role });
  });

  socket.on('join-consultation', async ({ roomId, userId, role, senderName }) => {
    if (!roomId || !userId) return;

    const previousRoom = socket.data?.consultationRoomId;
    if (previousRoom && previousRoom !== roomId) {
      socket.leave(previousRoom);
      socket.to(previousRoom).emit('consultation-user-left', { userId, role });
    }

    socket.join(roomId);
    socket.data.consultationRoomId = roomId;
    socket.data.userId = userId;
    socket.data.role = role;

    await Consultation.updateOne(
      { roomId },
      {
        $set: { status: 'active' },
        $push: {
          participants: {
            userId,
            role,
            socketId: socket.id,
            joinedAt: new Date()
          }
        }
      }
    ).catch(() => {});

    socket.to(roomId).emit('consultation-user-joined', {
      userId,
      role,
      senderName
    });
  });

  socket.on('leave-consultation', ({ roomId, userId, role }) => {
    if (!roomId) return;
    socket.leave(roomId);
    socket.to(roomId).emit('consultation-user-left', { userId, role });
    if (socket.data?.consultationRoomId === roomId) socket.data.consultationRoomId = null;
  });

  socket.on('consultation-typing', ({ roomId, userId, senderName, senderRole, isTyping }) => {
    if (!roomId) return;
    socket.to(roomId).emit('consultation-typing', { roomId, userId, senderName, senderRole, isTyping });
  });

  socket.on('consultation-message', async (data, ack) => {
    if (!data?.roomId || !data?.message?.trim() || !data?.senderId) return;

    try {
      const messageBody = {
        appointmentId: data.appointmentId,
        roomId: data.roomId,
        senderId: data.senderId,
        senderName: data.senderName || 'User',
        senderRole: data.senderRole || 'user',
        message: data.message.trim(),
        clientMessageId: data.clientMessageId,
        deliveredAt: new Date()
      };

      const savedMessage = data.clientMessageId
        ? await Message.findOneAndUpdate(
          { roomId: data.roomId, senderId: data.senderId, clientMessageId: data.clientMessageId },
          { $setOnInsert: messageBody },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        : await Message.create(messageBody);

      const payload = {
        _id: savedMessage._id,
        clientMessageId: savedMessage.clientMessageId,
        roomId: savedMessage.roomId,
        appointmentId: savedMessage.appointmentId,
        senderId: savedMessage.senderId,
        senderName: savedMessage.senderName,
        senderRole: savedMessage.senderRole,
        message: savedMessage.message,
        timestamp: savedMessage.createdAt,
        status: 'delivered',
        deliveredAt: savedMessage.deliveredAt,
        isRead: savedMessage.isRead
      };

      io.to(data.roomId).emit('consultation-message', payload);
      if (ack) ack({ ok: true, message: payload });
    } catch (err) {
      socket.emit('consultation-message-error', { error: err.message });
      if (ack) ack({ ok: false, error: err.message });
    }
  });

 

  socket.on('send-message', async ({ appointmentId, roomId, senderId, receiverId, message }) => {
    if (!message || !senderId) return;
    try {
      const savedMessage = await Message.create({
        appointmentId,
        roomId,
        senderId,
        receiverId,
        senderName: 'User',
        senderRole: 'user',
        message
      });

      const payload = { message: savedMessage, appointmentId, roomId };
      if (receiverId) {
        await Notification.create({
          userId: receiverId,
          title: 'New Message',
          message: 'You received a new message.',
          type: 'system',
          relatedAppointmentId: appointmentId,
          isRead: false
        });
        io.to(`user-${receiverId}`).emit('receive-message', payload);
      }
      socket.emit('message-sent', payload);
    } catch (err) {
      socket.emit('message-error', { error: err.message });
    }
  });

  socket.on('webrtc-offer', ({ roomId, offer }) => {
    if (roomId && offer) socket.to(roomId).emit('webrtc-offer', { offer });
  });

  socket.on('webrtc-answer', ({ roomId, answer }) => {
    if (roomId && answer) socket.to(roomId).emit('webrtc-answer', { answer });
  });

  socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => {
    if (roomId && candidate) socket.to(roomId).emit('webrtc-ice-candidate', { candidate });
  });
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io active on ws://localhost:${PORT}`);
});

module.exports = { app, server, io };
