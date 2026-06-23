require('dotenv').config();

const axios = require('axios');

const API = process.env.E2E_API_URL || 'https://smart-health-system-io2m.onrender.com';
const password = process.env.E2E_PASSWORD || 'E2ePass123!';
const patientEmail = process.env.E2E_PATIENT_EMAIL;
const doctorEmail = process.env.E2E_DOCTOR_EMAIL;
const appointmentId = process.env.E2E_APPOINTMENT_ID;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

async function main() {
  if (!patientEmail || !doctorEmail || !appointmentId) {
    throw new Error('E2E_PATIENT_EMAIL, E2E_DOCTOR_EMAIL, and E2E_APPOINTMENT_ID are required');
  }

  const patientLogin = await axios.post(`${API}/auth/patient/login`, { email: patientEmail, password });
  const doctorLogin = await axios.post(`${API}/auth/doctor/login`, { email: doctorEmail, password });

  const search = await axios.get(`${API}/search/patients`, {
    params: { q: patientEmail.split('@')[0] },
    headers: authHeader(doctorLogin.data.token)
  });

  const order = await axios.post(`${API}/payments/order`, {
    appointmentId,
    doctorId: doctorLogin.data.user.id,
    amount: 100,
    paymentType: 'online',
    paymentMethod: 'UPI'
  }, { headers: authHeader(patientLogin.data.token) });

  const confirmed = await axios.put(`${API}/payments/${order.data.payment._id}/confirm`, {
    transactionId: `e2e-txn-${Date.now()}`,
    paymentMethod: 'UPI',
    status: 'Paid'
  }, { headers: authHeader(patientLogin.data.token) });

  const invoice = await axios.get(`${API}/payments/${order.data.payment._id}/invoice`, {
    headers: authHeader(patientLogin.data.token),
    responseType: 'arraybuffer'
  });

  const invoiceBuffer = Buffer.from(invoice.data);
  const result = {
    searchPatients: search.data.patients.length,
    paymentStatus: confirmed.data.payment.status,
    invoiceContentType: invoice.headers['content-type'],
    invoiceBytes: invoiceBuffer.length,
    invoicePdf: invoiceBuffer.slice(0, 4).toString() === '%PDF'
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.searchPatients || result.paymentStatus !== 'Paid' || !result.invoicePdf) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.response?.data || error.message);
  process.exitCode = 1;
});
