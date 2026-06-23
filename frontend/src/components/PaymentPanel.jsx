import React, { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiClipboard, FiCopy, FiDownload, FiUploadCloud } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { paymentAPI } from '../utils/api';
import './PaymentPanel.css';

const getAppointmentId = (appointment) => appointment?._id || appointment?.appointmentId;

const PaymentPanel = ({ user, appointments = [], mode = 'patient', onRefresh }) => {
  const [payments, setPayments] = useState([]);
  const [activeAppointmentId, setActiveAppointmentId] = useState('');
  const [activePayment, setActivePayment] = useState(null);
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const payableAppointments = useMemo(() => appointments.filter((item) => item.doctorId && item.status !== 'cancelled'), [appointments]);
  const selectedAppointment = payableAppointments.find((item) => getAppointmentId(item) === activeAppointmentId) || payableAppointments[0];

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    if (!activeAppointmentId && selectedAppointment) setActiveAppointmentId(getAppointmentId(selectedAppointment));
  }, [activeAppointmentId, selectedAppointment]);

  const loadPayments = async () => {
    try {
      const response = await paymentAPI.getPayments();
      setPayments(response.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to load payments');
    }
  };

  const startUpiPayment = async () => {
    if (!selectedAppointment) {
      toast.info('No appointment selected for payment');
      return;
    }
    setLoading(true);
    try {
      const doctor = selectedAppointment.doctorId || {};
      const response = await paymentAPI.createUpiPayment({
        appointmentId: getAppointmentId(selectedAppointment),
        doctorId: doctor._id || doctor,
        amount: doctor.consultationFee || selectedAppointment.consultationFee || 500
      });
      setActivePayment(response.data.payment);
      await loadPayments();
      toast.success('UPI payment reference created');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to create UPI payment');
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshot = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshotUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const submitProof = async () => {
    const targetPayment = activePayment || qrPayment;
    if (!targetPayment?._id) return;
    if (!upiTransactionId.trim()) {
      toast.info('Enter the UPI transaction reference number');
      return;
    }
    if (!screenshotUrl) {
      toast.info('Upload the payment screenshot');
      return;
    }
    setLoading(true);
    try {
      const response = await paymentAPI.confirmPayment(targetPayment._id, {
        status: 'Pending',
        paymentMethod: 'UPI',
        upiTransactionId,
        screenshotUrl
      });
      setActivePayment(response.data.payment);
      setUpiTransactionId('');
      setScreenshotUrl('');
      await loadPayments();
      onRefresh?.();
      toast.success('Payment submitted for verification');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to submit payment proof');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (payment, status) => {
    try {
      await paymentAPI.confirmPayment(payment._id, { status });
      await loadPayments();
      onRefresh?.();
      toast.success(`Payment ${status.toLowerCase()}`);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to update payment');
    }
  };

  const downloadReceipt = async (paymentId) => {
    try {
      const response = await paymentAPI.downloadInvoice(paymentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Unable to download receipt');
    }
  };

  const qrPayment = activePayment || payments.find((payment) => String(payment.appointmentId?._id || payment.appointmentId) === String(activeAppointmentId));
  const qrUrl = qrPayment?.upiQrData ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayment.upiQrData)}` : '';

  if (mode !== 'patient') {
    return (
      <div className="payment-panel">
        <div className="payment-toolbar">
          <div>
            <h3>Payment Verification</h3>
            <span>{payments.filter((payment) => payment.status === 'Pending').length} pending</span>
          </div>
          <button onClick={loadPayments}>Refresh</button>
        </div>
        <div className="payment-list">
          {payments.map((payment) => (
            <div className="payment-row" key={payment._id}>
              <div>
                <strong>{payment.paymentReference || payment._id}</strong>
                <span>{payment.patientId?.name || 'Patient'} to Dr. {payment.doctorId?.name || 'Doctor'}</span>
                <small>{payment.upiTransactionId || payment.transactionId || 'No transaction ID'} · INR {payment.amount}</small>
              </div>
              <em className={`payment-status ${payment.status}`}>{payment.status}</em>
              <button onClick={() => verifyPayment(payment, 'Verified')}><FiCheckCircle /> Verify</button>
              <button onClick={() => verifyPayment(payment, 'Rejected')}>Reject</button>
              <button onClick={() => downloadReceipt(payment._id)}><FiDownload /> Receipt</button>
            </div>
          ))}
          {payments.length === 0 && <div className="payment-empty">No payment records yet</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="payment-panel">
      <div className="payment-toolbar">
        <div>
          <h3>UPI / GPay Payment</h3>
          <span>Appointment and consultation payments</span>
        </div>
        <button disabled={loading} onClick={startUpiPayment}><FiClipboard /> Create Reference</button>
      </div>

      <div className="payment-grid">
        <div className="payment-card">
          <label>
            Appointment
            <select value={activeAppointmentId} onChange={(event) => setActiveAppointmentId(event.target.value)}>
              {payableAppointments.map((appointment) => (
                <option key={getAppointmentId(appointment)} value={getAppointmentId(appointment)}>
                  Dr. {appointment.doctorId?.name || 'Doctor'} · {appointment.appointmentTime || 'Consultation'}
                </option>
              ))}
            </select>
          </label>
          {qrPayment ? (
            <>
              <div className="upi-qr">{qrUrl && <img src={qrUrl} alt="UPI QR Code" />}</div>
              <div className="upi-copy">
                <span>{qrPayment.upiId || 'UPI ID unavailable'}</span>
                <button onClick={() => navigator.clipboard?.writeText(qrPayment.upiId || '')}><FiCopy /></button>
              </div>
              <small>Reference: {qrPayment.paymentReference}</small>
            </>
          ) : (
            <div className="payment-empty">Create a UPI reference to show QR code and UPI ID</div>
          )}
        </div>

        <div className="payment-card">
          <label>
            UPI Transaction ID
            <input value={upiTransactionId} onChange={(event) => setUpiTransactionId(event.target.value)} placeholder="GPay / UPI transaction ID" />
          </label>
          <label className="upload-box">
            <FiUploadCloud />
            <span>{screenshotUrl ? 'Screenshot attached' : 'Upload payment screenshot'}</span>
            <input type="file" accept="image/*" onChange={handleScreenshot} />
          </label>
          <button disabled={loading || !qrPayment} onClick={submitProof}><FiCheckCircle /> Submit for Verification</button>
        </div>
      </div>

      <div className="payment-list">
        {payments.slice(0, 6).map((payment) => (
          <div className="payment-row" key={payment._id}>
            <div>
              <strong>{payment.paymentReference || payment._id}</strong>
              <span>{payment.paymentMethod} · INR {payment.amount}</span>
            </div>
            <em className={`payment-status ${payment.status}`}>{payment.status}</em>
            <button onClick={() => downloadReceipt(payment._id)}><FiDownload /> Receipt</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentPanel;
