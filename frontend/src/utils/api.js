import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://smart-health-system-i02m.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL
});

// Add auth token to all requests
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Handle 401 Unauthorized errors - clear token and redirect to login
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      alert('Your session has expired. Please log in again.');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  patientLogin: (data) => apiClient.post('/auth/patient/login', data),
  doctorLogin: (data) => apiClient.post('/auth/doctor/login', data),
  getCurrentUser: () => apiClient.get('/auth/me')
};

// User APIs
export const userAPI = {
  getAllDoctors: () => apiClient.get('/users/doctors/all'),
  getDoctorsBySpecialization: (specialization) => 
    apiClient.get(`/users/doctors/specialization/${specialization}`),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  getMedicalHistory: () => apiClient.get('/users/me/medical-history'),
  getPatientMedicalHistory: (patientId) => apiClient.get(`/users/patients/${patientId}/medical-history`),
  updateDoctorAvailability: (data) => 
    apiClient.put('/users/doctor/availability', data),
  getDoctorWorkload: (doctorId) => 
    apiClient.get(`/users/doctors/${doctorId}/workload`)
};

// AI APIs
export const aiAPI = {
  checkSymptoms: (data) => apiClient.post('/ai/symptom-check', data),
  aiChat: (data) => apiClient.post('/ai/chat', data),
  autoBookAppointment: (data) => apiClient.post('/ai/auto-book', data),
  getPredictionDetails: (appointmentId) => 
    apiClient.get(`/ai/prediction/${appointmentId}`),
  getChatHistory: () => apiClient.get('/ai/chat-history'),
  quickButtonInteraction: (data) => 
    apiClient.post('/ai/quick-button', data)
};

// Appointment APIs
export const appointmentAPI = {
  getUserAppointments: () => apiClient.get('/appointments'),
  getAppointmentDetails: (appointmentId) => 
    apiClient.get(`/appointments/${appointmentId}`),
  bookAppointment: (data) => apiClient.post('/appointments/book', data),
  updateAppointmentStatus: (appointmentId, data) => 
    apiClient.put(`/appointments/${appointmentId}/status`, data),
  rateAppointment: (appointmentId, data) => 
    apiClient.put(`/appointments/${appointmentId}/rate`, data),
  cancelAppointment: (appointmentId) => 
    apiClient.delete(`/appointments/${appointmentId}/cancel`),
  getEmergencyAppointments: () => 
    apiClient.get('/appointments/emergency/list'),
  getDoctorAppointments: () => apiClient.get('/doctor/appointments'),
  getDoctorStats: () => apiClient.get('/doctor/stats'),
  completeAppointmentAsDoctor: (appointmentId, data) =>
    apiClient.put(`/doctor/appointments/${appointmentId}/complete`, data),
  startVideoCallAsDoctor: (appointmentId) =>
    apiClient.post(`/doctor/appointments/${appointmentId}/video-call`),
  writePrescriptionAsDoctor: (appointmentId, data) =>
    apiClient.put(`/doctor/appointments/${appointmentId}/prescription`, data),
  updateDoctorAvailability: (data) => apiClient.put('/doctor/availability', data)
};

// Dashboard APIs
export const dashboardAPI = {
  getAdvancedAnalytics: () => apiClient.get('/dashboard/advanced'),
  getDashboardMetrics: () => apiClient.get('/dashboard/metrics'),
  getPatientDashboard: () => apiClient.get('/dashboard/patient'),
  getPatientGrowthTrend: () => apiClient.get('/dashboard/growth-trend'),
  getMonthlyStatistics: () => apiClient.get('/dashboard/monthly')
};

// Notification APIs
export const notificationAPI = {
  getNotifications: () => apiClient.get('/notifications'),
  getUnreadCount: () => apiClient.get('/notifications/unread/count'),
  markAsRead: (notificationId) => 
    apiClient.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read/all'),
  deleteNotification: (notificationId) => 
    apiClient.delete(`/notifications/${notificationId}`)
};

// Report APIs
export const reportAPI = {
  getPatientReports: () => apiClient.get('/reports'),
  getPatientPrescriptions: () => apiClient.get('/reports/prescriptions'),
  getReportSummary: () => apiClient.get('/reports/summary'),
  generateReport: (appointmentId) => 
    apiClient.get(`/reports/${appointmentId}/download`, { responseType: 'blob' }),
  generatePrescription: (prescriptionId) =>
    apiClient.get(`/reports/prescriptions/${prescriptionId}/download`, { responseType: 'blob' }),
  exportMultipleReports: (data) => 
    apiClient.post('/reports/export/batch', data)
};

// Chatbot APIs
export const chatbotAPI = {
  getChatbot: () => apiClient.get('/chatbot'),
sendMessage: (data) => apiClient.post('/ai/chat', data),
 getChatHistory: () => apiClient.get('/ai/chat-history'),
  handleQuickButton: (data) => 
    apiClient.post('/chatbot/quick-button', data),
  clearChatHistory: () => apiClient.delete('/chatbot/history')
};

export const searchAPI = {
  searchPatients: (query) => apiClient.get('/search/patients', { params: { q: query } })
};

export const paymentAPI = {
  getPayments: () => apiClient.get('/payments'),
  createOrder: (data) => apiClient.post('/payments/order', data),
  createUpiPayment: (data) => apiClient.post('/payments/upi', data),
  confirmPayment: (paymentId, data) => apiClient.put(`/payments/${paymentId}/confirm`, data),
  downloadInvoice: (paymentId) => apiClient.get(`/payments/${paymentId}/invoice`, { responseType: 'blob' })
};

export const consultationAPI = {
  getConsultation: (roomId) => apiClient.get(`/consultations/${roomId}`),
  markMessagesRead: (roomId) => apiClient.put(`/consultations/${roomId}/read`),
  endConsultation: (roomId) => apiClient.put(`/consultations/${roomId}/end`)
};

export default apiClient;
