import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useOutletContext } from 'react-router-dom';
import {
  FiActivity,
  FiBell,
  FiCalendar,
  FiChevronDown,
  FiClipboard,
  FiFileText,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMessageCircle,
  FiMoon,
  FiCreditCard,
  FiMoreVertical,
  FiSettings,
  FiStar,
  FiSun,
  FiUploadCloud,
  FiUsers,
  FiVideo
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './DoctorDashboard.css';
import { appointmentAPI, notificationAPI, userAPI } from '../utils/api';
import socketService from '../utils/socket';
import ConsultationRoom from './ConsultationRoom';
import DoctorLayout from './DoctorLayout';
import GlobalPatientSearch from './GlobalPatientSearch';
import PaymentPanel from './PaymentPanel';
import { useTheme } from '../context/ThemeContext';

const statusText = {
  scheduled: 'Confirmed',
  accepted: 'Confirmed',
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected'
};

const emptyReportForm = {
  diagnosis: '',
  advice: '',
  followUpDate: '',
  medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
};

// eslint-disable-next-line no-unused-vars
const DoctorDashboard = ({ user, onLogout }) => {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [reportForm, setReportForm] = useState(emptyReportForm);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [videoRoom, setVideoRoom] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const sectionRefs = {
    dashboard: useRef(null),
    appointments: useRef(null),
    patients: useRef(null),
    consultations: useRef(null),
    video: useRef(null),
    report: useRef(null),
    prescriptions: useRef(null),
    history: useRef(null),
    messages: useRef(null),
    payments: useRef(null),
    notifications: useRef(null),
    analytics: useRef(null),
    profile: useRef(null)
  };

  const doctor = user || JSON.parse(localStorage.getItem('user') || '{}');

  const loadPatientHistory = useCallback(async (doctorAppointments) => {
    const patientIds = [...new Set(doctorAppointments.map((appointment) => appointment.patientId?._id).filter(Boolean))];
    if (patientIds.length === 0) {
      setPatientHistory([]);
      return;
    }

    try {
      const historyResponses = await Promise.all(
        patientIds.map((patientId) => userAPI.getPatientMedicalHistory(patientId))
      );
      const history = historyResponses
        .flatMap((response) => response.data || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPatientHistory(history);
    } catch (error) {
      setPatientHistory([]);
    }
  }, []);

  const loadDashboard = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [appointmentRes, statsRes, notificationRes] = await Promise.all([
        appointmentAPI.getDoctorAppointments(),
        appointmentAPI.getDoctorStats(),
        notificationAPI.getNotifications()
      ]);

      setAppointments(appointmentRes.data.appointments || []);
      setStats(statsRes.data.stats || {});
      setNotifications(notificationRes.data || []);
      loadPatientHistory(appointmentRes.data.appointments || []);
    } catch (error) {
      const message = error?.response?.data?.error || error.message || 'Unable to load doctor dashboard';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [loadPatientHistory]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    socketService.connect();
    if (doctor?.id) socketService.doctorLogin(doctor.id);

    socketService.on('appointment-booked', (payload) => {
      toast.info('New appointment booked');
      loadDashboard(false);
    });
    socketService.on('appointment-updated', () => {
      loadDashboard(false);
    });

    return () => {
      socketService.removeListener('appointment-booked');
      socketService.removeListener('appointment-updated');
    };
  }, [doctor?.id, loadDashboard]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return appointments.filter((appointment) => {
      const date = appointment.appointmentDate ? new Date(appointment.appointmentDate).toDateString() : '';
      return date === today && appointment.status !== 'cancelled';
    });
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return appointments;
    return appointments.filter((appointment) => {
      const patient = appointment.patientId || {};
      return [
        patient.name,
        patient.email,
        appointment.appointmentTime,
        appointment.status,
        appointment.aiPrediction?.disease,
        appointment.symptoms?.join(' ')
      ].filter(Boolean).join(' ').toLowerCase().includes(query);
    });
  }, [appointments, searchTerm]);

  const recentPatients = useMemo(() => {
    const seen = new Set();
    return appointments
      .filter((appointment) => appointment.patientId?._id && !seen.has(appointment.patientId._id))
      .map((appointment) => {
        seen.add(appointment.patientId._id);
        return appointment;
      })
      .slice(0, 5);
  }, [appointments]);

  const uniquePatientCount = useMemo(() => {
    return new Set(appointments.map((appointment) => appointment.patientId?._id).filter(Boolean)).size;
  }, [appointments]);

  const pendingReports = appointments.filter((appointment) =>
    ['scheduled', 'accepted', 'in-progress'].includes(appointment.status)
  ).length;

  const chartData = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return labels.map((label, index) => {
      const total = appointments.filter((appointment) => {
        if (!appointment.appointmentDate) return false;
        return new Date(appointment.appointmentDate).getDay() === ((index + 1) % 7);
      }).length;
      const completed = appointments.filter((appointment) => {
        if (!appointment.appointmentDate) return false;
        return new Date(appointment.appointmentDate).getDay() === ((index + 1) % 7)
          && appointment.status === 'completed';
      }).length;
      return { day: label, appointments: total, completed };
    });
  }, [appointments]);

  const pieData = useMemo(() => {
    const completed = appointments.filter((appointment) => appointment.status === 'completed').length;
    const cancelled = appointments.filter((appointment) => appointment.status === 'cancelled').length;
    const pending = Math.max(appointments.length - completed - cancelled, 0);
    return [
      { name: 'Completed', value: completed, color: '#31c46b' },
      { name: 'Cancelled', value: cancelled, color: '#e9416f' },
      { name: 'Pending', value: pending, color: '#f8b748' }
    ];
  }, [appointments]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const navTo = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
    setTimeout(() => {
      sectionRefs[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const openReportModal = (appointment) => {
    setSelectedAppointment(appointment);
    setReportForm({
      ...emptyReportForm,
      diagnosis: appointment.diagnosis || '',
      medicines: appointment.prescription?.medicines?.length
        ? appointment.prescription.medicines
        : emptyReportForm.medicines
    });
  };

  const updateMedicine = (index, field, value) => {
    setReportForm((current) => ({
      ...current,
      medicines: current.medicines.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: value } : medicine
      )
    }));
  };

  const addMedicine = () => {
    setReportForm((current) => ({
      ...current,
      medicines: [...current.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }));
  };

  const handleAcceptAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.updateAppointmentStatus(appointmentId, { status: 'accepted' });
      toast.success('Appointment accepted');
      loadDashboard(false);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to accept appointment');
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.updateAppointmentStatus(appointmentId, { status: 'rejected' });
      toast.success('Appointment rejected');
      loadDashboard(false);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to reject appointment');
    }
  };

  const handleStartVideoCall = async (appointmentId) => {
    try {
      const response = await appointmentAPI.startVideoCallAsDoctor(appointmentId);
      toast.success('Video consultation started');
      setVideoRoom({
        roomId: response.data.videoRoomId,
        appointmentId: response.data.appointmentId
      });
      loadDashboard(false);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to start video call');
    }
  };

  const handleSubmitReport = async (event) => {
    event.preventDefault();
    if (!selectedAppointment) return;
    if (!reportForm.diagnosis.trim()) {
      toast.error('Diagnosis is required');
      return;
    }

    const medicines = reportForm.medicines.filter((medicine) => medicine.name.trim());

    try {
      await appointmentAPI.completeAppointmentAsDoctor(selectedAppointment._id, {
        diagnosis: reportForm.diagnosis,
        advice: reportForm.advice,
        followUpDate: reportForm.followUpDate || undefined,
        medicines
      });

      toast.success('Report generated and patient notified');
      setSelectedAppointment(null);
      setReportForm(emptyReportForm);
      loadDashboard(false);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to generate report');
    }
  };

  const getPatientInitials = (name = 'Patient') => name.split(' ').map((item) => item[0]).join('').slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="doctor-shell loading-shell">
        <div className="dashboard-loader">Loading doctor dashboard...</div>
      </div>
    );
  }

  if (videoRoom?.roomId) {
    return (
      <ConsultationRoom
        roomId={videoRoom.roomId}
        appointmentId={videoRoom.appointmentId}
        user={doctor}
        onClose={() => {
          setVideoRoom(null);
          loadDashboard(false);
        }}
      />
    );
  }

  return (
    <div className="doctor-shell">
      <aside className={`doctor-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="doctor-brand">
          <div className="brand-mark"><FiClipboard /></div>
          <div>
            <strong>Hospital AI</strong>
            <span>Smart Healthcare System</span>
          </div>
        </div>

        <nav className="doctor-nav">
          <span className="nav-label">Main</span>
          <button className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => navTo('dashboard')}>
            <FiHome /> Dashboard
          </button>
          <button className={activeSection === 'appointments' ? 'active' : ''} onClick={() => navTo('appointments')}>
            <FiCalendar /> Appointments
          </button>
          <button className={activeSection === 'patients' ? 'active' : ''} onClick={() => navTo('patients')}>
            <FiUsers /> Patient List
          </button>
          <button className={activeSection === 'consultations' ? 'active' : ''} onClick={() => navTo('consultations')}>
            <FiActivity /> Consultations
          </button>
          <button className={activeSection === 'video' ? 'active' : ''} onClick={() => navTo('video')}>
            <FiVideo /> Video Consultation
          </button>

          <span className="nav-label">Medical</span>
          <button className={activeSection === 'report' ? 'active' : ''} onClick={() => navTo('report')}>
            <FiFileText /> Create Report
          </button>
          <button className={activeSection === 'prescriptions' ? 'active' : ''} onClick={() => navTo('prescriptions')}>
            <FiClipboard /> Prescriptions
          </button>
          <button className={activeSection === 'history' ? 'active' : ''} onClick={() => navTo('history')}>
            <FiFileText /> Medical History
          </button>

          <span className="nav-label">Communication</span>
          <button className={activeSection === 'messages' ? 'active' : ''} onClick={() => navTo('messages')}><FiMessageCircle /> Messages <em>3</em></button>
          <button className={activeSection === 'payments' ? 'active' : ''} onClick={() => navTo('payments')}><FiCreditCard /> Payments</button>
          <button className={activeSection === 'notifications' ? 'active' : ''} onClick={() => navTo('notifications')}><FiBell /> Notifications <em>{unreadCount}</em></button>

          <span className="nav-label">Analytics</span>
          <button className={activeSection === 'analytics' ? 'active' : ''} onClick={() => navTo('analytics')}><FiActivity /> Analytics & Reports</button>

          <span className="nav-label">Settings</span>
          <button className={activeSection === 'profile' ? 'active' : ''} onClick={() => navTo('profile')}><FiSettings /> Profile Settings</button>
          <button className="logout-link" onClick={onLogout}><FiLogOut /> Logout</button>
        </nav>
      </aside>
      {sidebarOpen && <button className="sidebar-overlay" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}

      <main className="doctor-main">
        <header className="doctor-topbar">
          <button className="menu-button" onClick={() => setSidebarOpen((value) => !value)}><FiMenu /></button>
          <div>
            <h1>Doctor Dashboard</h1>
            <p>Welcome back, Dr. {doctor.name || 'Doctor'}</p>
          </div>
          <div className="topbar-actions">
            <GlobalPatientSearch onSelect={(patient) => { setSearchTerm(patient.name || patient.email || ''); navTo('patients'); }} />
            <button className="bell-button" onClick={toggleTheme}>{theme === 'dark' ? <FiSun /> : <FiMoon />}</button>
            <button className="bell-button" onClick={() => navTo('notifications')}><FiBell /><span>{unreadCount}</span></button>
            <div className="doctor-profile">
              <div className="doctor-avatar">{getPatientInitials(doctor.name || 'Dr')}</div>
              <div>
                <strong>Dr. {doctor.name || 'Doctor'}</strong>
                <span>{doctor.specialization || 'Specialist'}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="metric-grid dashboard-section" ref={sectionRefs.dashboard}>
          <MetricCard icon={<FiCalendar />} color="purple" label="Assigned Appointments" value={appointments.length} note={`${todayAppointments.length} today`} />
          <MetricCard icon={<FiUsers />} color="green" label="Total Patients" value={uniquePatientCount} note="+18% this month" />
          <MetricCard icon={<FiFileText />} color="orange" label="Pending Reports" value={pendingReports} note="View and complete" />
          <MetricCard icon={<FiActivity />} color="blue" label="Completed Consultations" value={stats?.completedAppointments || 0} note="+25% this month" />
          <MetricCard icon={<FiStar />} color="pink" label="Average Rating" value={`${stats?.averageRating || 0} / 5`} note="★★★★★" />
        </section>

        <section className="dashboard-grid">
          <div className="doctor-panel appointments-panel dashboard-section" ref={sectionRefs.appointments}>
            <PanelHeader title={activeSection === 'appointments' ? 'All Assigned Appointments' : 'Assigned Appointments'} action="View All" onAction={() => navTo('appointments')} />
            <div className="appointment-list">
              {(activeSection === 'appointments' || searchTerm ? filteredAppointments : filteredAppointments.slice(0, 6)).map((appointment) => (
                <AppointmentRow
                  key={appointment._id}
                  appointment={appointment}
                  onAccept={handleAcceptAppointment}
                  onReject={handleRejectAppointment}
                  onReport={openReportModal}
                  onVideo={handleStartVideoCall}
                />
              ))}
              {filteredAppointments.length === 0 && (
                <div className="empty-panel">No appointments found</div>
              )}
            </div>
          </div>

          <div className="doctor-panel quick-panel dashboard-section" ref={sectionRefs.report}>
            <PanelHeader title="Quick Actions" />
            <div className="quick-grid">
              <QuickAction icon={<FiFileText />} tone="purple" title="Create Report" text="Generate new medical report" onClick={() => appointments[0] ? openReportModal(appointments[0]) : toast.info('No appointment available')} />
              <QuickAction icon={<FiClipboard />} tone="green" title="New Prescription" text="Create prescription" onClick={() => appointments[0] ? openReportModal(appointments[0]) : toast.info('No appointment available')} />
              <QuickAction icon={<FiVideo />} tone="blue" title="Video Consultation" text="Start video call" onClick={() => appointments[0] ? handleStartVideoCall(appointments[0]._id) : toast.info('No appointment available')} />
              <QuickAction icon={<FiFileText />} tone="orange" title="Patient History" text="View medical history" onClick={() => setActiveSection('history')} />
              <QuickAction icon={<FiClipboard />} tone="pink" title="Add Medical Note" text="Add consultation notes" onClick={() => appointments[0] ? openReportModal(appointments[0]) : toast.info('No appointment available')} />
              <QuickAction icon={<FiUploadCloud />} tone="cyan" title="Upload Document" text="Upload patient document" onClick={() => toast.info('Cloudinary upload can be connected next')} />
            </div>
          </div>

          <div className="doctor-panel patients-panel dashboard-section" ref={sectionRefs.patients}>
            <PanelHeader title="Recent Patients" action="View All" onAction={() => setActiveSection('patients')} />
            {recentPatients.map((appointment) => (
              <div className="patient-row" key={appointment.patientId._id}>
                <div className="patient-avatar">{getPatientInitials(appointment.patientId.name)}</div>
                <div>
                  <strong>{appointment.patientId.name}</strong>
                  <span>{appointment.patientId.email || appointment.patientId.phone || 'No contact added'}</span>
                </div>
                <div>
                  <span>Last Visit</span>
                  <strong>{appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'N/A'}</strong>
                </div>
                <button onClick={() => openReportModal(appointment)}>View Profile</button>
              </div>
            ))}
            {recentPatients.length === 0 && <div className="empty-panel">No patients yet</div>}
          </div>

          <div className="doctor-panel overview-panel dashboard-section" ref={sectionRefs.analytics}>
            <PanelHeader title="Appointments Overview" action={<span>This Week <FiChevronDown /></span>} />
            <div className="overview-content">
              <ResponsiveContainer width="62%" height={230}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf5" />
                  <XAxis dataKey="day" stroke="#7a86a5" />
                  <YAxis stroke="#7a86a5" />
                  <Tooltip />
                  <Line type="monotone" dataKey="appointments" stroke="#4e6df5" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="completed" stroke="#37bc67" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="pie-wrap">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={pieData} innerRadius={48} outerRadius={76} paddingAngle={2} dataKey="value">
                      {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-total"><strong>{appointments.length}</strong><span>Total</span></div>
                <div className="legend-list">
                  {pieData.map((item) => (
                    <span key={item.name}><i style={{ background: item.color }} /> {item.name} ({item.value})</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="doctor-panel full-width-panel dashboard-section" ref={sectionRefs.history}>
              <PanelHeader title="Patient Medical History" />
              {patientHistory.slice(0, 12).map((item) => (
                <div className="doctor-history-row" key={item._id}>
                  <span className={`status-dot ${item.type}`} />
                  <div>
                    <strong>{item.title}</strong>
                    <small>{[item.diagnosis, item.department, item.createdBy?.name].filter(Boolean).join(' · ') || item.type}</small>
                  </div>
                  <time>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</time>
                </div>
              ))}
              {patientHistory.length === 0 && <div className="empty-panel">No medical history found for assigned patients</div>}
            </div>
          <div className="doctor-panel full-width-panel dashboard-section" ref={sectionRefs.video}>
            <PanelHeader title="Video Consultation" />
            <div className="quick-grid">
              {appointments.filter((appointment) => ['scheduled', 'accepted', 'in-progress'].includes(appointment.status)).slice(0, 4).map((appointment) => (
                <QuickAction key={appointment._id} icon={<FiVideo />} tone="blue" title={appointment.patientId?.name || 'Patient'} text={appointment.videoRoomId || 'Start secure room'} onClick={() => handleStartVideoCall(appointment._id)} />
              ))}
              {appointments.length === 0 && <div className="empty-panel">No consultations ready</div>}
            </div>
          </div>

          <div className="doctor-panel full-width-panel dashboard-section" ref={sectionRefs.prescriptions}>
            <PanelHeader title="Prescriptions" />
            <div className="quick-grid">
              {appointments.slice(0, 4).map((appointment) => (
                <QuickAction key={appointment._id} icon={<FiClipboard />} tone="green" title={appointment.patientId?.name || 'Patient'} text="Create or update prescription" onClick={() => openReportModal(appointment)} />
              ))}
            </div>
          </div>

          <div className="doctor-panel full-width-panel dashboard-section" ref={sectionRefs.consultations}>
            <PanelHeader title="Consultations" />
            {appointments.filter((appointment) => ['accepted', 'in-progress', 'completed'].includes(appointment.status)).slice(0, 8).map((appointment) => (
              <AppointmentRow key={appointment._id} appointment={appointment} onAccept={handleAcceptAppointment} onReject={handleRejectAppointment} onReport={openReportModal} onVideo={handleStartVideoCall} />
            ))}
          </div>

          <div className="doctor-panel full-width-panel dashboard-section" ref={sectionRefs.messages}>
            <PanelHeader title="Messages" />
            <div className="empty-panel">Real-time doctor-patient chat is available through Socket.IO events and ready for conversation UI expansion.</div>
          </div>

          <div className="doctor-panel full-width-panel dashboard-section" ref={sectionRefs.payments}>
            <PanelHeader title="Payment Verification" />
            <PaymentPanel user={doctor} appointments={appointments} mode="doctor" onRefresh={() => loadDashboard(false)} />
          </div>

          <div className="doctor-panel full-width-panel dashboard-section" ref={sectionRefs.notifications}>
            <PanelHeader title="Notifications" />
            {notifications.slice(0, 8).map((notification) => (
              <div className="doctor-history-row" key={notification._id}>
                <span className={`status-dot ${notification.type}`} />
                <div>
                  <strong>{notification.title}</strong>
                  <small>{notification.message}</small>
                </div>
                <time>{notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'N/A'}</time>
              </div>
            ))}
          </div>

          <div className="doctor-panel full-width-panel dashboard-section" ref={sectionRefs.profile}>
            <PanelHeader title="Profile Settings" />
            <div className="empty-panel">Availability, UPI ID, QR code URL, and consultation fee can be updated through the doctor availability API.</div>
          </div>
        </section>
      </main>

      {selectedAppointment && (
        <div className="modal-backdrop">
          <form className="report-modal" onSubmit={handleSubmitReport}>
            <div className="modal-title">
              <div>
                <h2>Create Medical Report</h2>
                <p>{selectedAppointment.patientId?.name} · {selectedAppointment.symptoms?.join(', ') || 'No symptoms listed'}</p>
              </div>
              <button type="button" onClick={() => setSelectedAppointment(null)}>Close</button>
            </div>

            <label>
              Diagnosis
              <textarea value={reportForm.diagnosis} onChange={(event) => setReportForm({ ...reportForm, diagnosis: event.target.value })} rows="3" required />
            </label>

            <div className="medicine-editor">
              <div className="medicine-header">
                <strong>Medicines</strong>
                <button type="button" onClick={addMedicine}>Add Medicine</button>
              </div>
              {reportForm.medicines.map((medicine, index) => (
                <div className="medicine-grid" key={index}>
                  <input placeholder="Medicine" value={medicine.name} onChange={(event) => updateMedicine(index, 'name', event.target.value)} />
                  <input placeholder="Dosage" value={medicine.dosage} onChange={(event) => updateMedicine(index, 'dosage', event.target.value)} />
                  <input placeholder="Frequency" value={medicine.frequency} onChange={(event) => updateMedicine(index, 'frequency', event.target.value)} />
                  <input placeholder="Duration" value={medicine.duration} onChange={(event) => updateMedicine(index, 'duration', event.target.value)} />
                  <input placeholder="Instructions" value={medicine.instructions} onChange={(event) => updateMedicine(index, 'instructions', event.target.value)} />
                </div>
              ))}
            </div>

            <label>
              Advice
              <textarea value={reportForm.advice} onChange={(event) => setReportForm({ ...reportForm, advice: event.target.value })} rows="3" />
            </label>

            <label>
              Follow-up Date
              <input type="date" value={reportForm.followUpDate} onChange={(event) => setReportForm({ ...reportForm, followUpDate: event.target.value })} />
            </label>

            <div className="modal-actions">
              <button type="button" onClick={() => setSelectedAppointment(null)}>Cancel</button>
              <button type="submit">Generate Report</button>
            </div>
          </form>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={2500} />
    </div>
  );
};

const MetricCard = ({ icon, color, label, value, note }) => (
  <article className="metric-card">
    <div className={`metric-icon ${color}`}>{icon}</div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  </article>
);

const PanelHeader = ({ title, action, onAction }) => (
  <div className="panel-header">
    <h2>{title}</h2>
    {action && <button onClick={onAction}>{action}</button>}
  </div>
);

const AppointmentRow = ({ appointment, onAccept, onReject, onReport, onVideo }) => {
  const patient = appointment.patientId || {};
  const canRespond = ['pending', 'scheduled'].includes(appointment.status);
  const confirmed = ['scheduled', 'accepted', 'in-progress'].includes(appointment.status);

  return (
    <div className="appointment-row">
      <div className="patient-avatar">{patient.name ? patient.name.split(' ').map((part) => part[0]).join('').slice(0, 2) : 'PT'}</div>
      <div className="appointment-patient">
        <strong>{patient.name || 'Unknown Patient'}</strong>
        <span>{patient.age ? `${patient.age} Y` : 'Patient'}{patient.gender ? `, ${patient.gender}` : ''}</span>
      </div>
      <div className="appointment-time">
        <strong>{appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'Date not set'}</strong>
        <span>{appointment.appointmentTime || 'Time not set'}</span>
        <span>{appointment.aiPrediction?.disease || appointment.symptoms?.join(', ') || 'Consultation'}</span>
      </div>
      <span className={`status-pill ${appointment.status}`}>{statusText[appointment.status] || appointment.status}</span>
      <div className="row-actions">
        {canRespond && <button onClick={() => onAccept(appointment._id)}>Accept</button>}
        {canRespond && <button onClick={() => onReject(appointment._id)}>Reject</button>}
        {confirmed && <button className="solid" onClick={() => onVideo(appointment._id)}><FiVideo /> Start</button>}
        <button onClick={() => onReport(appointment)}>{appointment.status === 'completed' ? 'View' : 'Report'}</button>
        <FiMoreVertical />
      </div>
    </div>
  );
};

const QuickAction = ({ icon, tone, title, text, onClick }) => (
  <button className="quick-action" onClick={onClick}>
    <span className={tone}>{icon}</span>
    <div>
      <strong>{title}</strong>
      <small>{text}</small>
    </div>
  </button>
);

const DoctorDashboardRouted = ({ user, onLogout }) => {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [reportForm, setReportForm] = useState(emptyReportForm);
  const [videoRoom, setVideoRoom] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const doctor = user || JSON.parse(localStorage.getItem('user') || '{}');

  const loadPatientHistory = useCallback(async (doctorAppointments) => {
    const patientIds = [...new Set(doctorAppointments.map((appointment) => appointment.patientId?._id).filter(Boolean))];
    if (patientIds.length === 0) {
      setPatientHistory([]);
      return;
    }

    try {
      const historyResponses = await Promise.all(patientIds.map((patientId) => userAPI.getPatientMedicalHistory(patientId)));
      const history = historyResponses
        .flatMap((response) => response.data || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPatientHistory(history);
    } catch (error) {
      setPatientHistory([]);
    }
  }, []);

  const loadDashboard = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [appointmentRes, statsRes, notificationRes] = await Promise.all([
        appointmentAPI.getDoctorAppointments(),
        appointmentAPI.getDoctorStats(),
        notificationAPI.getNotifications()
      ]);

      const nextAppointments = appointmentRes.data.appointments || [];
      setAppointments(nextAppointments);
      setStats(statsRes.data.stats || {});
      setNotifications(notificationRes.data || []);
      loadPatientHistory(nextAppointments);
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message || 'Unable to load doctor dashboard');
    } finally {
      setLoading(false);
    }
  }, [loadPatientHistory]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    socketService.connect();
    if (doctor?.id) socketService.doctorLogin(doctor.id);

    const refresh = () => loadDashboard(false);
    const handleBooked = () => {
      toast.info('New appointment booked');
      refresh();
    };

    socketService.on('appointment-booked', handleBooked);
    socketService.on('appointment-updated', refresh);
    socketService.on('payment-updated', refresh);

    return () => {
      socketService.removeListener('appointment-booked', handleBooked);
      socketService.removeListener('appointment-updated', refresh);
      socketService.removeListener('payment-updated', refresh);
    };
  }, [doctor?.id, loadDashboard]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return appointments.filter((appointment) => {
      const date = appointment.appointmentDate ? new Date(appointment.appointmentDate).toDateString() : '';
      return date === today && appointment.status !== 'cancelled';
    });
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return appointments;
    return appointments.filter((appointment) => {
      const patient = appointment.patientId || {};
      return [
        patient.name,
        patient.email,
        appointment.appointmentTime,
        appointment.status,
        appointment.aiPrediction?.disease,
        appointment.symptoms?.join(' ')
      ].filter(Boolean).join(' ').toLowerCase().includes(query);
    });
  }, [appointments, searchTerm]);

  const recentPatients = useMemo(() => {
    const seen = new Set();
    return appointments
      .filter((appointment) => appointment.patientId?._id && !seen.has(appointment.patientId._id))
      .map((appointment) => {
        seen.add(appointment.patientId._id);
        return appointment;
      });
  }, [appointments]);

  const uniquePatientCount = useMemo(() => (
    new Set(appointments.map((appointment) => appointment.patientId?._id).filter(Boolean)).size
  ), [appointments]);

  const pendingReports = appointments.filter((appointment) =>
    ['scheduled', 'accepted', 'in-progress'].includes(appointment.status)
  ).length;

  const chartData = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return labels.map((label, index) => {
      const dayIndex = (index + 1) % 7;
      return {
        day: label,
        appointments: appointments.filter((appointment) =>
          appointment.appointmentDate && new Date(appointment.appointmentDate).getDay() === dayIndex
        ).length,
        completed: appointments.filter((appointment) =>
          appointment.appointmentDate
          && new Date(appointment.appointmentDate).getDay() === dayIndex
          && appointment.status === 'completed'
        ).length
      };
    });
  }, [appointments]);

  const pieData = useMemo(() => {
    const completed = appointments.filter((appointment) => appointment.status === 'completed').length;
    const cancelled = appointments.filter((appointment) => appointment.status === 'cancelled').length;
    const pending = Math.max(appointments.length - completed - cancelled, 0);
    return [
      { name: 'Completed', value: completed, color: '#31c46b' },
      { name: 'Cancelled', value: cancelled, color: '#e9416f' },
      { name: 'Pending', value: pending, color: '#f8b748' }
    ];
  }, [appointments]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const openReportModal = (appointment) => {
    setSelectedAppointment(appointment);
    setReportForm({
      ...emptyReportForm,
      diagnosis: appointment.diagnosis || '',
      medicines: appointment.prescription?.medicines?.length
        ? appointment.prescription.medicines
        : emptyReportForm.medicines
    });
  };

  const updateMedicine = (index, field, value) => {
    setReportForm((current) => ({
      ...current,
      medicines: current.medicines.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: value } : medicine
      )
    }));
  };

  const addMedicine = () => {
    setReportForm((current) => ({
      ...current,
      medicines: [...current.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }));
  };

  const handleAcceptAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.updateAppointmentStatus(appointmentId, { status: 'accepted' });
      toast.success('Appointment accepted');
      loadDashboard(false);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to accept appointment');
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.updateAppointmentStatus(appointmentId, { status: 'rejected' });
      toast.success('Appointment rejected');
      loadDashboard(false);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to reject appointment');
    }
  };

  const handleStartVideoCall = async (appointmentId) => {
    try {
      const response = await appointmentAPI.startVideoCallAsDoctor(appointmentId);
      toast.success('Video consultation started');
      setVideoRoom({
        roomId: response.data.videoRoomId,
        appointmentId: response.data.appointmentId
      });
      loadDashboard(false);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to start video call');
    }
  };

  const handleSubmitReport = async (event) => {
    event.preventDefault();
    if (!selectedAppointment) return;
    if (!reportForm.diagnosis.trim()) {
      toast.error('Diagnosis is required');
      return;
    }

    const medicines = reportForm.medicines.filter((medicine) => medicine.name.trim());

    try {
      await appointmentAPI.completeAppointmentAsDoctor(selectedAppointment._id, {
        diagnosis: reportForm.diagnosis,
        advice: reportForm.advice,
        followUpDate: reportForm.followUpDate || undefined,
        medicines
      });

      toast.success('Report generated and patient notified');
      setSelectedAppointment(null);
      setReportForm(emptyReportForm);
      loadDashboard(false);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to generate report');
    }
  };

  const context = {
    doctor,
    appointments,
    filteredAppointments,
    stats,
    notifications,
    patientHistory,
    todayAppointments,
    recentPatients,
    uniquePatientCount,
    pendingReports,
    chartData,
    pieData,
    unreadCount,
    messageCount: 0,
    searchTerm,
    setSearchTerm,
    openReportModal,
    handleAcceptAppointment,
    handleRejectAppointment,
    handleStartVideoCall,
    loadDashboard,
    theme,
    toggleTheme
  };

  if (loading) {
    return (
      <div className="doctor-shell loading-shell">
        <div className="dashboard-loader">Loading doctor dashboard...</div>
      </div>
    );
  }

  if (videoRoom?.roomId) {
    return (
      <ConsultationRoom
        roomId={videoRoom.roomId}
        appointmentId={videoRoom.appointmentId}
        user={doctor}
        onClose={() => {
          setVideoRoom(null);
          loadDashboard(false);
        }}
      />
    );
  }

  return (
    <>
      <Routes>
        <Route path="/doctor" element={<DoctorLayout context={context} onLogout={onLogout} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboardHome />} />
          <Route path="appointments" element={<DoctorAppointmentsPage />} />
          <Route path="patients" element={<DoctorPatientsPage />} />
          <Route path="consultations" element={<DoctorConsultationsPage />} />
          <Route path="video-consultation" element={<DoctorVideoPage />} />
          <Route path="payments" element={<DoctorPaymentsPage />} />
          <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
          <Route path="reports" element={<DoctorReportsPage />} />
          <Route path="medical-history" element={<DoctorMedicalHistoryPage />} />
          <Route path="messages" element={<DoctorMessagesPage />} />
          <Route path="notifications" element={<DoctorNotificationsPage />} />
          <Route path="profile" element={<DoctorProfilePage />} />
          <Route path="settings" element={<DoctorSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
      </Routes>

      {selectedAppointment && (
        <div className="modal-backdrop">
          <form className="report-modal" onSubmit={handleSubmitReport}>
            <div className="modal-title">
              <div>
                <h2>Create Medical Report</h2>
                <p>{selectedAppointment.patientId?.name} - {selectedAppointment.symptoms?.join(', ') || 'No symptoms listed'}</p>
              </div>
              <button type="button" onClick={() => setSelectedAppointment(null)}>Close</button>
            </div>

            <label>
              Diagnosis
              <textarea value={reportForm.diagnosis} onChange={(event) => setReportForm({ ...reportForm, diagnosis: event.target.value })} rows="3" required />
            </label>

            <div className="medicine-editor">
              <div className="medicine-header">
                <strong>Medicines</strong>
                <button type="button" onClick={addMedicine}>Add Medicine</button>
              </div>
              {reportForm.medicines.map((medicine, index) => (
                <div className="medicine-grid" key={index}>
                  <input placeholder="Medicine" value={medicine.name} onChange={(event) => updateMedicine(index, 'name', event.target.value)} />
                  <input placeholder="Dosage" value={medicine.dosage} onChange={(event) => updateMedicine(index, 'dosage', event.target.value)} />
                  <input placeholder="Frequency" value={medicine.frequency} onChange={(event) => updateMedicine(index, 'frequency', event.target.value)} />
                  <input placeholder="Duration" value={medicine.duration} onChange={(event) => updateMedicine(index, 'duration', event.target.value)} />
                  <input placeholder="Instructions" value={medicine.instructions} onChange={(event) => updateMedicine(index, 'instructions', event.target.value)} />
                </div>
              ))}
            </div>

            <label>
              Advice
              <textarea value={reportForm.advice} onChange={(event) => setReportForm({ ...reportForm, advice: event.target.value })} rows="3" />
            </label>

            <label>
              Follow-up Date
              <input type="date" value={reportForm.followUpDate} onChange={(event) => setReportForm({ ...reportForm, followUpDate: event.target.value })} />
            </label>

            <div className="modal-actions">
              <button type="button" onClick={() => setSelectedAppointment(null)}>Cancel</button>
              <button type="submit">Generate Report</button>
            </div>
          </form>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={2500} />
    </>
  );
};

const DoctorDashboardHome = () => {
  const context = useOutletContext();
  const navigate = useNavigate();
  const {
    doctor,
    appointments,
    stats,
    todayAppointments,
    uniquePatientCount,
    pendingReports,
    recentPatients,
    chartData,
    pieData,
    openReportModal,
    handleStartVideoCall
  } = context;

  return (
    <div className="doctor-page-content">
      <section className="doctor-welcome">
        <div>
          <span>Clinical overview</span>
          <h2>Good day, Dr. {doctor.name || 'Doctor'}</h2>
          <p>Monitor appointments, patients, reports, payments, and consultations from a single focused workspace.</p>
        </div>
        <button type="button" onClick={() => navigate('/doctor/appointments')}>View Schedule</button>
      </section>

      <section className="metric-grid route-metrics">
        <MetricCard icon={<FiCalendar />} color="purple" label="Assigned Appointments" value={appointments.length} note={`${todayAppointments.length} today`} />
        <MetricCard icon={<FiUsers />} color="green" label="Total Patients" value={uniquePatientCount} note="Assigned patients" />
        <MetricCard icon={<FiFileText />} color="orange" label="Pending Reports" value={pendingReports} note="View and complete" />
        <MetricCard icon={<FiActivity />} color="blue" label="Completed Consultations" value={stats?.completedAppointments || 0} note="This month" />
        <MetricCard icon={<FiStar />} color="pink" label="Average Rating" value={`${stats?.averageRating || 0} / 5`} note="Patient feedback" />
      </section>

      <section className="doctor-dashboard-overview">
        <div className="doctor-panel route-card">
          <PanelHeader title="Assigned Appointments" action="View All" onAction={() => navigate('/doctor/appointments')} />
          <div className="appointment-list compact-list">
            {appointments.slice(0, 5).map((appointment) => (
              <AppointmentRow key={appointment._id} appointment={appointment} {...appointmentHandlers(context)} />
            ))}
            {appointments.length === 0 && <div className="empty-panel">No appointments assigned yet</div>}
          </div>
        </div>

        <div className="doctor-panel route-card">
          <PanelHeader title="Quick Actions" />
          <div className="quick-grid two-column">
            <QuickAction icon={<FiFileText />} tone="purple" title="Create Report" text="Complete consultation notes" onClick={() => appointments[0] ? openReportModal(appointments[0]) : toast.info('No appointment available')} />
            <QuickAction icon={<FiClipboard />} tone="green" title="New Prescription" text="Add medicines to a visit" onClick={() => appointments[0] ? openReportModal(appointments[0]) : toast.info('No appointment available')} />
            <QuickAction icon={<FiVideo />} tone="blue" title="Video Consultation" text="Open appointment room" onClick={() => appointments[0] ? handleStartVideoCall(appointments[0]._id) : toast.info('No appointment available')} />
            <QuickAction icon={<FiCreditCard />} tone="orange" title="Verify Payment" text="Review UPI proof" onClick={() => navigate('/doctor/payments')} />
          </div>
        </div>

        <div className="doctor-panel route-card">
          <PanelHeader title="Recent Patients" action="View All" onAction={() => navigate('/doctor/patients')} />
          <PatientRows appointments={recentPatients.slice(0, 5)} onOpen={openReportModal} />
        </div>

        <div className="doctor-panel route-card analytics-card">
          <PanelHeader title="Analytics" />
          <AnalyticsView chartData={chartData} pieData={pieData} total={appointments.length} />
        </div>
      </section>
    </div>
  );
};

const DoctorAppointmentsPage = () => {
  const context = useOutletContext();
  return (
    <PageShell title="Assigned Appointments">
      <div className="doctor-panel route-card">
        <div className="doctor-table-scroll">
          <div className="appointment-list">
            {context.filteredAppointments.map((appointment) => (
              <AppointmentRow key={appointment._id} appointment={appointment} {...appointmentHandlers(context)} />
            ))}
            {context.filteredAppointments.length === 0 && <div className="empty-panel">No appointments found</div>}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

const DoctorPatientsPage = () => {
  const { recentPatients, openReportModal } = useOutletContext();
  return (
    <PageShell title="Patient List">
      <div className="doctor-panel route-card">
        <PatientRows appointments={recentPatients} onOpen={openReportModal} />
      </div>
    </PageShell>
  );
};

const DoctorConsultationsPage = () => {
  const context = useOutletContext();
  const consultations = context.appointments.filter((appointment) => ['accepted', 'in-progress', 'completed'].includes(appointment.status));
  return (
    <PageShell title="Consultations">
      <div className="doctor-panel route-card">
        {consultations.map((appointment) => (
          <AppointmentRow key={appointment._id} appointment={appointment} {...appointmentHandlers(context)} />
        ))}
        {consultations.length === 0 && <div className="empty-panel">No active consultations</div>}
      </div>
    </PageShell>
  );
};

const DoctorVideoPage = () => {
  const { appointments, handleStartVideoCall } = useOutletContext();
  const videoAppointments = appointments.filter((appointment) => ['scheduled', 'accepted', 'in-progress'].includes(appointment.status));
  return (
    <PageShell title="Video Consultation">
      <div className="route-card-grid">
        {videoAppointments.map((appointment) => (
          <QuickAction
            key={appointment._id}
            icon={<FiVideo />}
            tone="blue"
            title={appointment.patientId?.name || 'Patient'}
            text={appointment.videoRoomId || 'Start secure room'}
            onClick={() => handleStartVideoCall(appointment._id)}
          />
        ))}
        {videoAppointments.length === 0 && <div className="doctor-panel empty-panel">No video consultations ready</div>}
      </div>
    </PageShell>
  );
};

const DoctorPaymentsPage = () => {
  const { doctor, appointments, loadDashboard } = useOutletContext();
  return (
    <PageShell title="Payment Verification">
      <div className="doctor-panel route-card payment-route-card">
        <PaymentPanel user={doctor} appointments={appointments} mode="doctor" onRefresh={() => loadDashboard(false)} />
      </div>
    </PageShell>
  );
};

const DoctorReportsPage = () => {
  const { appointments, openReportModal } = useOutletContext();
  return (
    <PageShell title="Reports">
      <div className="route-card-grid">
        {appointments.map((appointment) => (
          <QuickAction key={appointment._id} icon={<FiFileText />} tone="purple" title={appointment.patientId?.name || 'Patient'} text={appointment.status === 'completed' ? 'View completed report' : 'Create report'} onClick={() => openReportModal(appointment)} />
        ))}
      </div>
    </PageShell>
  );
};

const DoctorPrescriptionsPage = () => {
  const { appointments, openReportModal } = useOutletContext();
  return (
    <PageShell title="Prescriptions">
      <div className="route-card-grid">
        {appointments.map((appointment) => (
          <QuickAction key={appointment._id} icon={<FiClipboard />} tone="green" title={appointment.patientId?.name || 'Patient'} text="Create or update prescription" onClick={() => openReportModal(appointment)} />
        ))}
      </div>
    </PageShell>
  );
};

const DoctorMedicalHistoryPage = () => {
  const { patientHistory } = useOutletContext();
  return (
    <PageShell title="Medical History">
      <div className="doctor-panel route-card">
        {patientHistory.map((item) => (
          <div className="doctor-history-row" key={item._id}>
            <span className={`status-dot ${item.type}`} />
            <div>
              <strong>{item.title}</strong>
              <small>{[item.diagnosis, item.department, item.createdBy?.name].filter(Boolean).join(' - ') || item.type}</small>
            </div>
            <time>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</time>
          </div>
        ))}
        {patientHistory.length === 0 && <div className="empty-panel">No medical history found for assigned patients</div>}
      </div>
    </PageShell>
  );
};

const DoctorMessagesPage = () => (
  <PageShell title="Messages">
    <div className="doctor-panel route-card empty-panel">Appointment-room chat is available inside Video Consultation rooms.</div>
  </PageShell>
);

const DoctorNotificationsPage = () => {
  const { notifications } = useOutletContext();
  return (
    <PageShell title="Notifications">
      <div className="doctor-panel route-card">
        {notifications.map((notification) => (
          <div className="doctor-history-row" key={notification._id}>
            <span className={`status-dot ${notification.type}`} />
            <div>
              <strong>{notification.title}</strong>
              <small>{notification.message}</small>
            </div>
            <time>{notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'N/A'}</time>
          </div>
        ))}
        {notifications.length === 0 && <div className="empty-panel">No notifications yet</div>}
      </div>
    </PageShell>
  );
};

const DoctorProfilePage = () => {
  const { doctor } = useOutletContext();
  return (
    <PageShell title="Profile">
      <div className="doctor-panel route-card profile-grid">
        <div className="doctor-avatar large">{doctor.name ? doctor.name[0].toUpperCase() : 'D'}</div>
        <div>
          <h3>Dr. {doctor.name || 'Doctor'}</h3>
          <p>{doctor.specialization || 'General Physician'}</p>
          <p>{doctor.email || doctor.phone || 'Contact details not added'}</p>
        </div>
      </div>
    </PageShell>
  );
};

const DoctorSettingsPage = () => (
  <PageShell title="Settings">
    <div className="doctor-panel route-card empty-panel">Availability, consultation fee, and UPI settings are ready for doctor profile API updates.</div>
  </PageShell>
);

const PageShell = ({ title, children }) => (
  <div className="doctor-page-content">
    <div className="page-title-row">
      <h2>{title}</h2>
    </div>
    {children}
  </div>
);

const appointmentHandlers = (context) => ({
  onAccept: context.handleAcceptAppointment,
  onReject: context.handleRejectAppointment,
  onReport: context.openReportModal,
  onVideo: context.handleStartVideoCall
});

const PatientRows = ({ appointments, onOpen }) => (
  <>
    {appointments.map((appointment) => (
      <div className="patient-row" key={appointment.patientId._id}>
        <div className="patient-avatar">{appointment.patientId.name ? appointment.patientId.name.split(' ').map((part) => part[0]).join('').slice(0, 2) : 'PT'}</div>
        <div>
          <strong>{appointment.patientId.name}</strong>
          <span>{appointment.patientId.email || appointment.patientId.phone || 'No contact added'}</span>
        </div>
        <div>
          <span>Last Visit</span>
          <strong>{appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'N/A'}</strong>
        </div>
        <button onClick={() => onOpen(appointment)}>View Profile</button>
      </div>
    ))}
    {appointments.length === 0 && <div className="empty-panel">No patients yet</div>}
  </>
);

const AnalyticsView = ({ chartData, pieData, total }) => (
  <div className="overview-content route-analytics">
    <ResponsiveContainer width="62%" height={230}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf5" />
        <XAxis dataKey="day" stroke="#7a86a5" />
        <YAxis stroke="#7a86a5" />
        <Tooltip />
        <Line type="monotone" dataKey="appointments" stroke="#4e6df5" strokeWidth={3} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="completed" stroke="#37bc67" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
    <div className="pie-wrap">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie data={pieData} innerRadius={48} outerRadius={76} paddingAngle={2} dataKey="value">
            {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="pie-total"><strong>{total}</strong><span>Total</span></div>
      <div className="legend-list">
        {pieData.map((item) => (
          <span key={item.name}><i style={{ background: item.color }} /> {item.name} ({item.value})</span>
        ))}
      </div>
    </div>
  </div>
);

export default DoctorDashboardRouted;
