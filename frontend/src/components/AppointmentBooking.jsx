import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import './AppointmentBooking.css';
import { appointmentAPI, userAPI, aiAPI } from '../utils/api';

const AppointmentBooking = ({ userId, onBookingComplete }) => {
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [specialization, setSpecialization] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [useAutoBook, setUseAutoBook] = useState(false);

  const specializations = [
    'Cardiology',
    'Neurology',
    'Dermatology',
    'Orthopedics',
    'General',
    'Emergency',
    'Pediatrics',
    'Psychiatry'
  ];

  const availableTimes = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM'
  ];

  // Step 1: Symptoms
  const handleSymptomAnalysis = async () => {
    if (!symptoms.trim()) {
      toast.error('Please enter symptoms');
      return;
    }

    setLoading(true);
    try {
      const response = await aiAPI.checkSymptoms({
        symptoms: symptoms.split(',').map(s => s.trim())
      });
      setPrediction(response.data.prediction);
      
      if (response.data.prediction.isEmergency) {
        toast.error('🚨 EMERGENCY DETECTED - Immediate medical attention required!');
        setUseAutoBook(true);
      }

      // Load doctors by recommended department
      loadDoctorsBySpecialization(response.data.prediction.recommendedDepartment);
      setStep(2);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error analyzing symptoms');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorsBySpecialization = async (spec) => {
    try {
      const response = await userAPI.getDoctorsBySpecialization(spec);
      setDoctors(response.data || []);
      if (!response.data || response.data.length === 0) {
        toast.warning('⚠️ No doctors available for this specialty');
      }
    } catch (error) {
      console.error('Error loading doctors:', error?.response?.data || error?.message);
      const errorMsg = error?.response?.data?.error || error?.message || 'Error loading doctors';
      toast.error(`❌ ${errorMsg}`);
    }
  };

  // Auto-book appointment
  const handleAutoBook = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.autoBookAppointment({
        symptoms: symptoms.split(',').map(s => s.trim())
      });

      if (response.data.message) {
        toast.success(response.data.message);
        if (onBookingComplete) {
          onBookingComplete(response.data.appointment);
        }
        // Reset form
        setStep(1);
        setSymptoms('');
        setPrediction(null);
        setUseAutoBook(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error booking appointment');
    } finally {
      setLoading(false);
    }
  };

  // Manual appointment booking
  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('Please select doctor, date, and time');
      return;
    }

    setLoading(true);
    try {
      const response = await appointmentAPI.bookAppointment({
        doctorId: selectedDoctor._id,
        symptoms: symptoms.split(',').map(s => s.trim()),
        appointmentDate: selectedDate,
        appointmentTime: selectedTime
      });

      toast.success('✓ Appointment booked successfully');
      if (onBookingComplete) {
        onBookingComplete(response.data.appointment);
      }

      // Reset form
      setStep(1);
      setSymptoms('');
      setPrediction(null);
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedTime('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error booking appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointment-booking">
      <div className="booking-header">
        <h2>📅 Smart Appointment Booking</h2>
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>
      </div>

      {/* Step 1: Symptoms */}
      {step === 1 && (
        <div className="step-content">
          <h3>Step 1: Describe Your Symptoms</h3>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Enter your symptoms..."
            rows="6"
            disabled={loading}
          />
          <button
            className="btn-primary"
            onClick={handleSymptomAnalysis}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze & Proceed'}
          </button>
        </div>
      )}

      {/* Prediction Alert */}
      {prediction && (
        <div className={`prediction-alert ${prediction.severity.toLowerCase()}`}>
          <h4>AI Analysis Result</h4>
          <p><strong>Condition:</strong> {prediction.disease}</p>
          <p><strong>Confidence:</strong> {prediction.confidence}%</p>
          <p><strong>Severity:</strong> {prediction.severity}</p>
          <p><strong>Recommended:</strong> {prediction.recommendedDepartment}</p>
          
          {prediction.isEmergency && (
            <div className="emergency-banner">
              🚨 This is an EMERGENCY case - Priority treatment needed!
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Doctor */}
      {step === 2 && !useAutoBook && (
        <div className="step-content">
          <h3>Step 2: Select a Doctor</h3>
          {doctors.length > 0 ? (
            <>
              <div className="doctors-grid">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className={`doctor-card ${selectedDoctor?._id === doctor._id ? 'selected' : ''}`}
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <div className="doctor-header">
                      <h4>{doctor.name}</h4>
                      <span className="specialization">{doctor.specialization}</span>
                    </div>
                    <div className="doctor-info">
                      <p>⭐ {doctor.averageRating || 'N/A'}</p>
                      <p>{doctor.isAvailable ? '✓ Available' : '✗ Unavailable'}</p>
                      <p>Workload: {doctor.workload}</p>
                    </div>
                    {selectedDoctor?._id === doctor._id && (
                      <div className="selected-badge">✓ Selected</div>
                    )}
                  </div>
                ))}
              </div>
              <button
                className="btn-primary"
                onClick={() => setStep(3)}
                disabled={!selectedDoctor}
              >
                Continue to Select Time
              </button>
            </>
          ) : (
            <p className="error-message">No doctors available for this specialization</p>
          )}
        </div>
      )}

      {/* Step 3: Select Date & Time */}
      {step === 3 && !useAutoBook && (
        <div className="step-content">
          <h3>Step 3: Select Date & Time</h3>
          
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Time:</label>
            <div className="time-slots">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                  onClick={() => setSelectedTime(time)}
                  disabled={loading}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="booking-summary">
            <h4>Booking Summary</h4>
            <p><strong>Doctor:</strong> {selectedDoctor?.name}</p>
            <p><strong>Specialization:</strong> {selectedDoctor?.specialization}</p>
            <p><strong>Date:</strong> {selectedDate}</p>
            <p><strong>Time:</strong> {selectedTime}</p>
            <p><strong>Condition:</strong> {prediction?.disease}</p>
          </div>

          <button
            className="btn-primary"
            onClick={handleBookAppointment}
            disabled={loading || !selectedDate || !selectedTime}
          >
            {loading ? 'Booking...' : '✓ Confirm Booking'}
          </button>
        </div>
      )}

      {/* Auto-Book Step */}
      {step === 2 && useAutoBook && (
        <div className="step-content auto-book">
          <h3>🤖 Auto-Booking an Appointment</h3>
          <p>Your symptoms indicate an emergency or urgent condition. Our AI will automatically book you with the best available specialist.</p>
          
          <button
            className="btn-primary btn-emergency"
            onClick={handleAutoBook}
            disabled={loading}
          >
            {loading ? 'Auto-Booking...' : '⚡ Auto-Book Appointment'}
          </button>

          <button
            className="btn-secondary"
            onClick={() => setUseAutoBook(false)}
            disabled={loading}
          >
            Manual Selection Instead
          </button>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default AppointmentBooking;
