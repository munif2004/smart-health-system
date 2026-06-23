const Appointment = require('../models/Appointment');
const ChatHistory = require('../models/ChatHistory');
const MedicalHistory = require('../models/MedicalHistory');
const Notification = require('../models/Notification');
const {
  analyzeSymptomsWithGemini,
  generateChatReply,
  extractSymptomsFromText
} = require('../utils/aiEngine');
const { autoBookAppointment } = require('../utils/appointmentEngine');

const normalizeSymptomInput = (symptoms, text) => {
  if (Array.isArray(symptoms)) return symptoms.filter(Boolean);
  if (typeof symptoms === 'string') return extractSymptomsFromText(symptoms);
  if (text) return extractSymptomsFromText(text);
  return [];
};

// Smart AI Symptom Checker with Gemini-first triage.
exports.checkSymptoms = async (req, res) => {
  try {
    const { symptoms, text } = req.body;
    const symptomList = normalizeSymptomInput(symptoms, text);
    const inputText = text || (Array.isArray(symptoms) ? symptoms.join(', ') : symptoms);

    if (!inputText && symptomList.length === 0) {
      return res.status(400).json({ error: 'Please provide symptoms' });
    }

    const analysis = await analyzeSymptomsWithGemini(inputText || symptomList);

    if (req.user?.userId) {
      await MedicalHistory.create({
        patientId: req.user.userId,
        type: 'symptom-analysis',
        title: `AI symptom analysis - ${analysis.possibleCondition}`,
        symptoms: analysis.extractedSymptoms,
        diagnosis: analysis.possibleCondition,
        department: analysis.recommendedDepartment,
        severity: analysis.severity,
        notes: analysis.recommendations?.join(' ')
      });
    }

    res.json({
      message: 'Symptom analysis completed',
      prediction: {
        disease: analysis.possibleCondition,
        confidence: analysis.confidence,
        severity: analysis.severity,
        urgency: analysis.urgency,
        recommendedDepartment: analysis.recommendedDepartment,
        isEmergency: analysis.isEmergency,
        extractedSymptoms: analysis.extractedSymptoms,
        suggestedActions: analysis.recommendations,
        followUpQuestions: analysis.followUpQuestions,
        disclaimer: analysis.disclaimer,
        source: analysis.source
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Conversational healthcare assistant.
exports.aiChat = async (req, res) => {
  try {
    const { message, userId } = req.body;
    const resolvedUserId = req.user?.userId || userId;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let history = null;
    let previousConversation = [];

    if (resolvedUserId) {
      history = await ChatHistory.findOne({ userId: resolvedUserId });
      previousConversation = history?.conversation?.slice(-10) || [];
    }

    const aiResponse = await generateChatReply(
      previousConversation,
      message
    );

    const responseText =
      typeof aiResponse === 'object'
        ? aiResponse.message
        : aiResponse;

    if (resolvedUserId) {
      if (history) {
        history.conversation.push(
          {
            role: 'user',
            message
          },
          {
            role: 'assistant',
            message: responseText
          }
        );

        history.lastActiveAt = new Date();
        await history.save();
      } else {
        await ChatHistory.create({
          userId: resolvedUserId,
          userRole: req.user?.role || 'patient',
          conversation: [
            {
              role: 'user',
              message
            },
            {
              role: 'assistant',
              message: responseText
            }
          ]
        });
      }
    }

    res.json({
      message: responseText,
      department: aiResponse.department || null,
      doctor: aiResponse.doctor || null,
      bookingLink: aiResponse.bookingLink || null,
      timestamp: new Date()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
};

// Auto-book appointment after symptom check.
exports.autoBookAppointmentBySymptoms = async (req, res) => {
  try {
    const { symptoms, text, appointmentDate, appointmentTime } = req.body;
    const userId = req.user.userId;
    const symptomList = normalizeSymptomInput(symptoms, text);
    const analysis = await analyzeSymptomsWithGemini(text || symptomList);

    if (symptomList.length === 0 && !text) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    const prediction = {
      disease: analysis.possibleCondition,
      confidence: analysis.confidence,
      severity: analysis.severity,
      urgency: analysis.urgency,
      recommendedDepartment: analysis.recommendedDepartment,
      isEmergency: analysis.isEmergency,
      extractedSymptoms: analysis.extractedSymptoms,
      recommendations: analysis.recommendations,
      source: analysis.source
    };

    const result = await autoBookAppointment(
      userId,
      analysis.extractedSymptoms?.length ? analysis.extractedSymptoms : symptomList,
      prediction,
      { appointmentDate, appointmentTime }
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const io = req.app.get('io');
    const notification = await Notification.create({
      userId: result.doctor._id,
      title: 'New Appointment Booked',
      message: `A patient booked an appointment for ${prediction.recommendedDepartment}.`,
      type: 'appointment-booked',
      relatedAppointmentId: result.appointment._id
    });

    io.to(`doctor-${result.doctor._id}`).emit('appointment-booked', {
      appointmentId: result.appointment._id,
      patientId: userId,
      severity: prediction.severity,
      isEmergency: prediction.isEmergency,
      notification
    });

    res.status(201).json({
      message: 'Appointment booked automatically',
      appointment: {
        id: result.appointment._id,
        doctorName: result.doctor.name,
        doctorId: result.doctor._id,
        specialization: result.doctor.specialization,
        appointmentDate: result.appointment.appointmentDate,
        appointmentTime: result.appointment.appointmentTime,
        prediction: result.appointment.aiPrediction
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPredictionDetails = (req, res) => {
  const { appointmentId } = req.params;

  Appointment.findById(appointmentId)
    .populate('doctorId', 'name specialization')
    .then(appointment => {
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json({
        appointmentId: appointment._id,
        symptoms: appointment.symptoms,
        prediction: appointment.aiPrediction,
        doctor: {
          name: appointment.doctorId.name,
          specialization: appointment.doctorId.specialization
        },
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime
      });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

exports.getChatHistory = (req, res) => {
  const userId = req.user.userId;

  ChatHistory.findOne({ userId })
    .then(history => {
      if (!history) {
        return res.json({ conversation: [] });
      }
      res.json({ conversation: history.conversation });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

exports.quickButtonInteraction = async (req, res) => {
  try {
    const { buttonType } = req.body;
    const buttonResponses = {
      'check-symptoms': 'Please describe your symptoms, duration, and severity.',
      'book-appointment': 'I can help book an appointment. Tell me your symptoms first so I can recommend a department.',
      'emergency-help': 'If this is an emergency, call local emergency services or visit the nearest hospital immediately.'
    };

    const response = buttonResponses[buttonType] || 'How can I help you today?';
    res.json({ message: response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
