const ChatHistory = require('../models/ChatHistory');
const { generateChatReply } = require('../utils/aiEngine');
const { generateHealthcareReply } = require('../services/geminiService');

// Get chatbot with enhanced features
exports.getChatbot = (req, res) => {
  res.json({
    message: 'Welcome to Hospital AI Assistant',
    quickButtons: [
      {
        id: 'check-symptoms',
        label: 'Check Symptoms',
        icon: 'search',
        description: 'Analyze your symptoms with AI'
      },
      {
        id: 'book-appointment',
        label: 'Book Appointment',
        icon: 'calendar',
        description: 'Schedule with a specialist'
      },
      {
        id: 'emergency-help',
        label: 'Emergency Help',
        icon: 'alert',
        description: 'Get immediate assistance'
      }
    ],
    features: [
      'Symptom checking',
      'Appointment booking',
      'Medical information',
      'Emergency guidance'
    ]
  });
};

// Send chatbot message with typing indicator
exports.sendChatMessage = async (req, res) => {
  const { message, userId } = req.body;
  const resolvedUserId = req.user?.userId || userId;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const history = resolvedUserId ? await ChatHistory.findOne({ userId: resolvedUserId }) : null;
    const previousConversation = history?.conversation?.slice(-12) || [];
    const aiResult = await generateHealthcareReply({
      message,
      history: previousConversation,
      userRole: req.user?.role || 'patient'
    });
    const reply = aiResult.reply || await generateChatReply(previousConversation, message);

    if (resolvedUserId) {
      if (history) {
        history.conversation.push({ role: 'user', message });
        history.conversation.push({ role: 'assistant', message: reply, metadata: aiResult.metadata });
        history.lastActiveAt = new Date();
        await history.save();
      } else {
        await ChatHistory.create({
          userId: resolvedUserId,
          userRole: req.user?.role || 'patient',
          conversation: [
            { role: 'user', message },
            { role: 'assistant', message: reply, metadata: aiResult.metadata }
          ]
        });
      }
    }

    res.json({
      message: reply,
      metadata: aiResult.metadata,
      timestamp: new Date(),
      isTyping: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get chat history for user
exports.getUserChatHistory = (req, res) => {
  const userId = req.user.userId;

  ChatHistory.findOne({ userId })
    .select('conversation lastActiveAt')
    .then(history => {
      if (!history) {
        return res.json({ conversation: [] });
      }
      res.json({
        conversation: history.conversation,
        lastActiveAt: history.lastActiveAt
      });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Clear chat history
exports.clearChatHistory = (req, res) => {
  const userId = req.user.userId;

  ChatHistory.findOneAndDelete({ userId })
    .then(() => res.json({ message: 'Chat history cleared' }))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Send quick button response
exports.handleQuickButton = (req, res) => {
  const { buttonType, userId } = req.body;

  const buttonMessages = {
    'check-symptoms': {
      response: 'Please describe your symptoms in detail. What are you experiencing?',
      nextAction: 'symptom-check'
    },
    'book-appointment': {
      response: 'I can help you book an appointment. Would you like to describe your symptoms or choose a specialty?',
      nextAction: 'appointment-booking'
    },
    'emergency-help': {
      response: '🚨 EMERGENCY: Please call 911 or visit the nearest emergency room immediately if you\'re in critical condition!',
      nextAction: 'emergency-redirect'
    }
  };

  const data = buttonMessages[buttonType] || { response: 'How can I help?', nextAction: null };

  // Save interaction
  if (userId) {
    ChatHistory.findOne({ userId })
      .then(history => {
        if (history) {
          history.conversation.push({
            role: 'user',
            message: buttonType,
            type: 'quick-button'
          });
          history.conversation.push({
            role: 'assistant',
            message: data.response
          });
          history.save();
        }
      })
      .catch(err => console.error('Error:', err));
  }

  res.json({
    message: data.response,
    nextAction: data.nextAction,
    timestamp: new Date()
  });
};
