require('dotenv').config();

const axios = require('axios');
const mongoose = require('mongoose');
const { io } = require('socket.io-client');

const Appointment = require('./models/Appointment');
const Report = require('./models/Report');
const Prescription = require('./models/Prescription');
const MedicalHistory = require('./models/MedicalHistory');

const API = process.env.E2E_API_URL || 'https://smart-health-system-io2m.onrender.com';
const SOCKET_URL = process.env.E2E_SOCKET_URL || 'https://smart-health-system-io2m.onrender.com';
const stamp = Date.now();
const password = 'E2ePass123!';

const results = [];
const record = (item, pass, detail = '') => {
  results.push({ item, status: pass ? 'PASS' : 'FAIL', detail });
};

const waitForEvent = (socket, event, predicate = () => true, timeoutMs = 5000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => {
    socket.off(event, handler);
    reject(new Error(`Timed out waiting for ${event}`));
  }, timeoutMs);

  const handler = (payload) => {
    try {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    } catch (err) {
      clearTimeout(timer);
      socket.off(event, handler);
      reject(err);
    }
  };

  socket.on(event, handler);
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
const pdfIsValid = (response) => {
  const buffer = Buffer.from(response.data);
  return response.status === 200 &&
    String(response.headers['content-type']).includes('application/pdf') &&
    buffer.length > 100 &&
    buffer.slice(0, 4).toString() === '%PDF';
};

async function main() {
  const patient = {
    name: `E2E Patient ${stamp}`,
    email: `e2e.patient.${stamp}@example.com`,
    password,
    role: 'patient',
    phone: '5550100001',
    age: 34,
    gender: 'Other',
    bloodGroup: 'O+'
  };

  const doctor = {
    name: `E2E Doctor ${stamp}`,
    email: `e2e.doctor.${stamp}@example.com`,
    password,
    role: 'doctor',
    specialization: 'General',
    phone: '5550100002',
    age: 44,
    gender: 'Other'
  };

  let patientLogin;
  let doctorLogin;
  let appointmentId;
  let roomId;
  let reportId;
  let prescriptionId;

  const patientSocket = io(SOCKET_URL, { transports: ['websocket'], forceNew: true });
  const doctorSocket = io(SOCKET_URL, { transports: ['websocket'], forceNew: true });
  const doctorRoomSocket = io(SOCKET_URL, { transports: ['websocket'], forceNew: true });
  const patientRoomSocket = io(SOCKET_URL, { transports: ['websocket'], forceNew: true });

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-ai');

    await axios.post(`${API}/auth/register`, patient);
    await axios.post(`${API}/auth/register`, doctor);

    patientLogin = await axios.post(`${API}/auth/patient/login`, {
      email: patient.email,
      password
    });
    record('1. Patient login', patientLogin.data?.token && patientLogin.data?.user?.role === 'patient');

    doctorLogin = await axios.post(`${API}/auth/doctor/login`, {
      email: doctor.email,
      password
    });

    patientSocket.emit('patient-login', patientLogin.data.user.id);
    doctorSocket.emit('doctor-login', doctorLogin.data.user.id);

    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const booking = await axios.post(`${API}/appointments/book`, {
      doctorId: doctorLogin.data.user.id,
      symptoms: ['fever', 'cough', 'fatigue'],
      appointmentDate: future.toISOString(),
      appointmentTime: '10:30 AM',
      aiPrediction: {
        disease: 'Viral fever',
        confidence: 0.86,
        severity: 'Moderate',
        recommendedDepartment: 'General',
        urgency: 'Soon',
        isEmergency: false,
        extractedSymptoms: ['fever', 'cough', 'fatigue'],
        recommendations: ['Hydration', 'Rest'],
        source: 'e2e'
      }
    }, { headers: authHeader(patientLogin.data.token) });
    appointmentId = booking.data?.appointment?._id;
    record('2. Appointment booking', booking.status === 201 && Boolean(appointmentId));

    const savedAppointment = await Appointment.findById(appointmentId).lean();
    record('3. Appointment saved in MongoDB', savedAppointment?.patientId?.toString() === patientLogin.data.user.id && savedAppointment?.doctorId?.toString() === doctorLogin.data.user.id);

    record('4. Doctor login', doctorLogin.data?.token && doctorLogin.data?.user?.role === 'doctor');

    const doctorDashboard = await axios.get(`${API}/doctor/appointments`, {
      headers: authHeader(doctorLogin.data.token)
    });
    const appointmentInDoctorDashboard = doctorDashboard.data?.appointments?.some((appointment) => appointment._id === appointmentId);
    record('5. Same appointment visible in Doctor Dashboard', appointmentInDoctorDashboard);

    const acceptedEvent = waitForEvent(patientSocket, 'appointment-accepted', (payload) => payload.appointmentId === appointmentId);
    const accepted = await axios.put(`${API}/appointments/${appointmentId}/status`, {
      status: 'accepted'
    }, { headers: authHeader(doctorLogin.data.token) });
    record('6. Doctor accepts appointment', accepted.data?.appointment?.status === 'accepted');
    await acceptedEvent;
    record('7. Patient receives Socket.IO notification', true, 'appointment-accepted received');

    const videoEvent = waitForEvent(patientSocket, 'video-call-incoming', (payload) => payload.appointmentId === appointmentId);
    const video = await axios.post(`${API}/doctor/appointments/${appointmentId}/video-call`, {}, {
      headers: authHeader(doctorLogin.data.token)
    });
    roomId = video.data?.videoRoomId;
    const videoPayload = await videoEvent;
    record('8. Doctor starts video consultation', Boolean(roomId) && videoPayload.videoRoomId === roomId);

    const patientJoinedEvent = waitForEvent(doctorRoomSocket, 'consultation-user-joined', (payload) => payload.userId === patientLogin.data.user.id && payload.role === 'patient');
    doctorRoomSocket.emit('join-consultation', { roomId, userId: doctorLogin.data.user.id, role: 'doctor' });
    patientRoomSocket.emit('join-consultation', { roomId, userId: patientLogin.data.user.id, role: 'patient' });
    await patientJoinedEvent;
    record('9. Patient joins same consultation room', true, roomId);

    const completion = await axios.put(`${API}/doctor/appointments/${appointmentId}/complete`, {
      diagnosis: 'Viral upper respiratory infection',
      medicines: [{
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '3 days',
        instructions: 'After food'
      }],
      advice: 'Rest, fluids, and return if fever persists.',
      notes: 'Vitals stable during consultation.',
      vitals: {
        temperature: '99.1 F',
        bloodPressure: '120/80',
        pulse: '78',
        oxygenLevel: '98%',
        weight: '70kg'
      },
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }, { headers: authHeader(doctorLogin.data.token) });
    reportId = completion.data?.report?._id;
    prescriptionId = completion.data?.prescription?._id;
    record('10. Doctor creates report', completion.data?.appointment?.status === 'completed' && Boolean(reportId));

    const savedReport = await Report.findOne({ appointmentId }).lean();
    record('11. Report saved in MongoDB', savedReport?._id?.toString() === reportId);

    const patientDashboardAfterReport = await axios.get(`${API}/dashboard/patient`, {
      headers: authHeader(patientLogin.data.token)
    });
    const reportVisible = patientDashboardAfterReport.data?.reports?.some((report) => report.reportId === reportId || report._id === reportId);
    record('12. Report visible in Patient Dashboard', reportVisible);

    const prescription = await axios.put(`${API}/doctor/appointments/${appointmentId}/prescription`, {
      medicines: [{
        name: 'Cetirizine',
        dosage: '10mg',
        frequency: 'Once nightly',
        duration: '5 days',
        instructions: 'Take before sleep'
      }],
      advice: 'Avoid cold drinks for a few days.'
    }, { headers: authHeader(doctorLogin.data.token) });
    prescriptionId = prescription.data?.prescription?._id || prescriptionId;
    record('13. Doctor creates prescription', Boolean(prescription.data?.prescription?._id));

    const patientDashboardAfterPrescription = await axios.get(`${API}/dashboard/patient`, {
      headers: authHeader(patientLogin.data.token)
    });
    const prescriptionVisible = patientDashboardAfterPrescription.data?.prescriptions?.some((item) => item._id === prescriptionId);
    record('14. Prescription visible in Patient Dashboard', prescriptionVisible);

    const history = await MedicalHistory.find({ patientId: patientLogin.data.user.id, appointmentId }).lean();
    const hasReportHistory = history.some((item) => item.type === 'report');
    const hasPrescriptionHistory = history.some((item) => item.type === 'prescription');
    record('15. Medical history updated automatically', hasReportHistory && hasPrescriptionHistory);

    const reportPdf = await axios.get(`${API}/reports/${appointmentId}/download`, {
      headers: authHeader(patientLogin.data.token),
      responseType: 'arraybuffer',
      validateStatus: () => true
    });
    record('16. Report PDF download works', pdfIsValid(reportPdf));

    const prescriptionPdf = await axios.get(`${API}/reports/prescriptions/${prescriptionId}/download`, {
      headers: authHeader(patientLogin.data.token),
      responseType: 'arraybuffer',
      validateStatus: () => true
    });
    record('17. Prescription PDF download works', pdfIsValid(prescriptionPdf));
  } catch (err) {
    const failedItem = results.length + 1;
    record(`${failedItem}. Workflow stopped`, false, err.response?.data?.error || err.message);
  } finally {
    [patientSocket, doctorSocket, doctorRoomSocket, patientRoomSocket].forEach((socket) => socket.close());
    await mongoose.disconnect().catch(() => {});
  }

  console.log(JSON.stringify({
    api: API,
    socket: SOCKET_URL,
    patientEmail: patient.email,
    doctorEmail: doctor.email,
    appointmentId,
    roomId,
    reportId,
    prescriptionId,
    results
  }, null, 2));

  if (results.some((result) => result.status === 'FAIL') || results.length < 17) {
    process.exitCode = 1;
  }
}

main();
