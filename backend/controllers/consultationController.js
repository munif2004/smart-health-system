const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Message = require('../models/Message');

const dedupeMessages = (messages) => {
  const seen = new Set();
  return messages.filter((message) => {
    const createdAt = message.createdAt || new Date();
    const bucket = Math.floor(new Date(createdAt).getTime() / 3000);
    const key = message.clientMessageId ||
      `${message.roomId}:${message.senderId}:${message.message}:${bucket}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const canAccessRoom = async (roomId, user) => {
  const consultation = await Consultation.findOne({ roomId });
  if (!consultation) return { allowed: false };

  const userId = user.userId;
  const role = user.role;
  const allowed = role === 'admin' ||
    consultation.doctorId.toString() === userId ||
    consultation.patientId.toString() === userId;

  return { allowed, consultation };
};

exports.getConsultation = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { allowed, consultation } = await canAccessRoom(roomId, req.user);
    if (!allowed) return res.status(403).json({ error: 'Unauthorized consultation access' });

    const messages = await Message.find({ roomId })
      .populate('senderId', 'name role')
      .sort({ createdAt: 1 })
      .limit(250);

    const unreadCount = await Message.countDocuments({
      roomId,
      senderId: { $ne: req.user.userId },
      isRead: false
    });

    res.json({ consultation, messages: dedupeMessages(messages), unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markMessagesRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { allowed } = await canAccessRoom(roomId, req.user);
    if (!allowed) return res.status(403).json({ error: 'Unauthorized consultation access' });

    await Message.updateMany(
      { roomId, senderId: { $ne: req.user.userId }, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    req.app.get('io').to(roomId).emit('consultation-messages-read', {
      roomId,
      readerId: req.user.userId
    });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.endConsultation = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { allowed, consultation } = await canAccessRoom(roomId, req.user);
    if (!allowed) return res.status(403).json({ error: 'Unauthorized consultation access' });

    consultation.status = 'ended';
    consultation.endTime = new Date();
    await consultation.save();

    await Appointment.findOneAndUpdate(
      { videoRoomId: roomId },
      { $set: { status: 'completed', completedAt: new Date() } }
    );

    req.app.get('io').to(roomId).emit('consultation-ended', { roomId });
    res.json({ message: 'Consultation ended', consultation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
