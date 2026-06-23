const axios = require('axios');

const emergencyTerms = [
  'chest pain',
  'difficulty breathing',
  'shortness of breath',
  'stroke',
  'severe bleeding',
  'unconscious',
  'seizure',
  'suicidal'
];

const detectEmergency = (message = '') => {
  const text = message.toLowerCase();
  return emergencyTerms.some((term) => text.includes(term));
};

const fallbackMedicalReply = (message) => {
  const isEmergency = detectEmergency(message);
  if (isEmergency) {
    return {
      reply: 'Your symptoms may need urgent medical attention. Please call emergency services or go to the nearest emergency department now. I can still help summarize symptoms for the doctor.',
      metadata: {
        emergency: true,
        department: 'Emergency',
        recommendation: 'Immediate emergency care'
      }
    };
  }

  return {
    reply: 'I can help with symptom triage, doctor or department suggestions, appointment planning, and follow-up reminders. Tell me your symptoms, how long they have been present, your age, and any major conditions or medicines.',
    metadata: {
      emergency: false,
      department: 'General',
      recommendation: 'Describe symptoms for triage'
    }
  };
};

exports.generateHealthcareReply = async ({ message, history = [], userRole = 'patient' }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackMedicalReply(message);
  }

  const recentContext = history
    .slice(-10)
    .map((item) => `${item.role === 'assistant' ? 'Assistant' : 'User'}: ${item.message}`)
    .join('\n');

  const prompt = [
    'You are a cautious AI health assistant inside a healthcare SaaS platform.',
    'Give concise, practical guidance. Do not diagnose definitively. Recommend emergency care for red flags.',
    'Include department recommendation, doctor recommendation, appointment suggestion, and follow-up reminder when relevant.',
    `User role: ${userRole}`,
    recentContext ? `Recent conversation:\n${recentContext}` : '',
    `Current user message: ${message}`
  ].filter(Boolean).join('\n\n');

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await axios.post(url, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        topP: 0.8,
        maxOutputTokens: 700
      }
    }, { timeout: 15000 });

    const reply = response.data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n').trim();
    if (!reply) return fallbackMedicalReply(message);

    return {
      reply,
      metadata: {
        emergency: detectEmergency(message),
        provider: 'gemini',
        model
      }
    };
  } catch (error) {
    const fallback = fallbackMedicalReply(message);
    return {
      ...fallback,
      metadata: {
        ...fallback.metadata,
        provider: 'fallback',
        error: error.response?.data?.error?.message || error.message
      }
    };
  }
};
