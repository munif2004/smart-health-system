const axios = require('axios');

// Rule-based disease diagnosis system used when Gemini is not configured.
const diseaseDatabase = {
  'chest pain': {
    disease: 'Cardiac Issues',
    confidence: 0.85,
    severity: 'Critical',
    department: 'Cardiology'
  },
  'breathing issue': {
    disease: 'Respiratory Issue',
    confidence: 0.80,
    severity: 'Critical',
    department: 'Emergency'
  },
  'unconscious': {
    disease: 'Loss of Consciousness',
    confidence: 0.95,
    severity: 'Critical',
    department: 'Emergency'
  },
  'headache': {
    disease: 'Migraine/Tension Headache',
    confidence: 0.70,
    severity: 'Low',
    department: 'Neurology'
  },
  'back pain': {
    disease: 'Spinal Disorder',
    confidence: 0.72,
    severity: 'Medium',
    department: 'Orthopedics'
  },
  'skin rash': {
    disease: 'Dermatitis',
    confidence: 0.75,
    severity: 'Low',
    department: 'Dermatology'
  },
  'fever': {
    disease: 'Infection/Flu',
    confidence: 0.68,
    severity: 'Medium',
    department: 'General'
  },
  'abdominal pain': {
    disease: 'Gastric Issue',
    confidence: 0.65,
    severity: 'Medium',
    department: 'General'
  },
  'joint pain': {
    disease: 'Arthritis',
    confidence: 0.70,
    severity: 'Low',
    department: 'Orthopedics'
  },
  'anxiety': {
    disease: 'Anxiety Disorder',
    confidence: 0.73,
    severity: 'Medium',
    department: 'Psychiatry'
  }
};

const emergencyKeywords = ['chest pain', 'breathing issue', 'unconscious', 'severe pain', 'bleeding'];

const symptomKeywords = [
  'fever', 'headache', 'cough', 'cold', 'chest pain', 'breathing issue',
  'shortness of breath', 'vomiting', 'nausea', 'abdominal pain', 'back pain',
  'skin rash', 'joint pain', 'anxiety', 'dizziness', 'fatigue', 'sore throat',
  'bleeding', 'unconscious', 'diarrhea'
];

const extractSymptomsFromText = (text = '') => {
  const normalized = text.toLowerCase();
  const found = symptomKeywords.filter(symptom => normalized.includes(symptom));
  if (found.length > 0) return [...new Set(found)];
  return normalized
    .split(/,|and|with|\n/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 8);
};

const getPrediction = (symptoms) => {
  let maxConfidence = 0;
  let bestMatch = null;

  symptoms.forEach(symptom => {
    const symptomLower = symptom.toLowerCase();
    
    for (const [key, value] of Object.entries(diseaseDatabase)) {
      if (symptomLower.includes(key) && value.confidence > maxConfidence) {
        maxConfidence = value.confidence;
        bestMatch = value;
      }
    }
  });

  const isEmergency = symptoms.some(s => 
    emergencyKeywords.some(k => s.toLowerCase().includes(k))
  );

  return {
    disease: bestMatch?.disease || 'General Consultation Needed',
    confidence: Math.max(maxConfidence, 0.5),
    severity: isEmergency ? 'Critical' : (bestMatch?.severity || 'Low'),
    recommendedDepartment: bestMatch?.department || 'General',
    isEmergency
  };
};

const buildFallbackAnalysis = (input) => {
  const symptoms = Array.isArray(input) ? input : extractSymptomsFromText(input);
  const prediction = getPrediction(symptoms);
  const durationText = Array.isArray(input) ? input.join(' ') : input;
  const hasLongFever = /fever/.test(durationText.toLowerCase()) && /3|three|4|four|5|five|week/.test(durationText.toLowerCase());
  const severity = prediction.severity === 'Low' && hasLongFever ? 'Medium' : prediction.severity;

  return {
    extractedSymptoms: symptoms,
    possibleCondition: prediction.disease,
    severity,
    urgency: prediction.isEmergency ? 'Immediate emergency care' : severity === 'Medium' ? 'Book appointment within 24-48 hours' : 'Routine consultation',
    recommendedDepartment: prediction.recommendedDepartment,
    confidence: Math.round(prediction.confidence * 100),
    isEmergency: prediction.isEmergency,
    recommendations: prediction.isEmergency
      ? ['Call emergency services or visit the nearest emergency department.', 'Do not delay care for critical symptoms.']
      : ['Stay hydrated and monitor temperature.', 'Book an appointment with the recommended department.', 'Seek urgent care if symptoms worsen.'],
    followUpQuestions: ['How many days have you had these symptoms?', 'Do you have breathing difficulty, chest pain, or severe weakness?'],
    disclaimer: 'This AI result is for triage support and does not replace a medical diagnosis.',
    source: 'local-fallback'
  };
};

const parseGeminiJson = (text) => {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Gemini response did not contain JSON');
  }
  return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
};

const analyzeSymptomsWithGemini = async (input) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return buildFallbackAnalysis(input);
    }

    const prompt = `
You are a healthcare triage assistant for a hospital management system.
Analyze this patient statement: "${Array.isArray(input) ? input.join(', ') : input}"
Return ONLY valid JSON with these keys:
extractedSymptoms array, possibleCondition string, severity Low|Medium|High|Critical,
urgency string, recommendedDepartment string, confidence number 0-100,
isEmergency boolean, recommendations array, followUpQuestions array, disclaimer string.
Do not provide final diagnosis. Encourage doctor consultation.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const analysis = parseGeminiJson(text);
    return {
      ...buildFallbackAnalysis(input),
      ...analysis,
      confidence: Math.max(0, Math.min(100, Number(analysis.confidence) || 70)),
      source: 'gemini'
    };
  } catch (error) {
   console.log(
  "Gemini Error:",
  JSON.stringify(error.response?.data, null, 2)
);
    return buildFallbackAnalysis(input);
  }
};





const generateChatReply = async (conversation, latestMessage) => {
const msg = latestMessage.toLowerCase();

// Greetings
if (['hi', 'hello', 'hey'].some(word => msg.includes(word))) {
return {
message: `Hello 👋 Welcome to Smart Health Assistant.

How can I help you today?

• Symptom Check
• Doctor Recommendation
• Appointment Booking
• Video Consultation`
};
}

// Booking
if (
msg.includes('book') ||
msg.includes('appointment') ||
msg.includes('yes')
) {
return {
message: `📅 Appointment Booking

Please click the Book Appointment button below to continue.`,
bookingLink: '/appointments'
};
}

// Video Consultation
if (
msg.includes('video') ||
msg.includes('consultation')
) {
return {
message: `🎥 Video Consultation Available

You can connect with a doctor online.`,
bookingLink: '/consultation'
};
}

// Fever
if (msg.includes('fever')) {
return {
message: `Fever may indicate a viral or bacterial infection.

🏥 Department: General Medicine
👨‍⚕️ Doctor: General Physician

Would you like to:

1. Book Appointment
2. Video Consultation`,
   department: 'General Medicine',
   doctor: 'General Physician'
   };
   }

// Headache
if (msg.includes('headache')) {
return {
message: `Headache may be related to stress, migraine, dehydration, or lack of sleep.

🏥 Department: Neurology
👨‍⚕️ Doctor: Neurologist

Would you like to:

1. Book Appointment
2. Video Consultation`,
   department: 'Neurology',
   doctor: 'Neurologist'
   };
   }

// Knee Pain
if (msg.includes('knee pain')) {
return {
message: `Knee pain may be caused by injury, arthritis, or inflammation.

🏥 Department: Orthopedics
👨‍⚕️ Doctor: Orthopedic Specialist

Would you like to:

1. Book Appointment
2. Video Consultation`,
   department: 'Orthopedics',
   doctor: 'Orthopedic Specialist'
   };
   }

return {
message: `Please describe your symptoms.

Examples:
• Fever
• Headache
• Knee Pain
• Back Pain
• Cough
• Chest Pain`
};
};


module.exports = {
  getPrediction,
  analyzeSymptomsWithGemini,
  generateChatReply,
  extractSymptomsFromText,
  buildFallbackAnalysis,
  diseaseDatabase,
  emergencyKeywords
};
