import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiBell,
  FiCalendar,
  FiClipboard,
  FiDownload,
  FiFileText,
  FiHeart,
  FiHome,
  FiLogOut,
  FiMessageCircle,
  FiMenu,
  FiMoon,
  FiCreditCard,
  FiSettings,
  FiSun,
  FiSearch,
  FiVideo
} from 'react-icons/fi';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './PatientDashboard.css';
import { dashboardAPI, notificationAPI, reportAPI } from '../utils/api';
import socketService from '../utils/socket';
import SmartChatbot from './SmartChatbot';
import ConsultationRoom from './ConsultationRoom';
import AppointmentBooking from './AppointmentBooking';
import PaymentPanel from './PaymentPanel';
import { useTheme } from '../context/ThemeContext';

const statusLabels = {
  pending: 'Pending',
  scheduled: 'Scheduled',
  accepted: 'Confirmed',
  rejected: 'Rejected',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const EMPTY_LIST = [];
const EMPTY_SUMMARY = {};

const formatDate = (date) => {
  if (!date) return 'Not scheduled';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTimeAgo = (date) => {
  if (!date) return 'Just now';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day ago`;
};

const PatientDashboard = ({ user, onLogout, onBookAppointment }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [videoRoom, setVideoRoom] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const sectionRefs = {
    dashboard: useRef(null),
    assistant: useRef(null),
    booking: useRef(null),
    payments: useRef(null),
    appointments: useRef(null),
    video: useRef(null),
    reports: useRef(null),
    prescriptions: useRef(null),
    history: useRef(null),
    notifications: useRef(null),
    profile: useRef(null)
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    socketService.connect();
    if (user?.id) socketService.patientLogin(user.id);

    const refreshWithToast = (message) => {
      if (message) toast.info(message);
      loadDashboard(false);
    };

    socketService.on('appointment-accepted', () => refreshWithToast('Appointment confirmed'));
    socketService.on('appointment-rejected', () => refreshWithToast('Appointment rejected'));
    socketService.on('appointment-updated', () => refreshWithToast('Appointment updated'));
    socketService.on('appointment-cancelled', () => refreshWithToast('Appointment cancelled'));
    socketService.on('report-generated', () => refreshWithToast('New report available'));
    socketService.on('prescription-received', () => refreshWithToast('New prescription available'));
    socketService.on('prescription-added', () => refreshWithToast('New prescription available'));
    socketService.on('video-call-incoming', (payload) => {
      setVideoRoom({
        roomId: payload.videoRoomId,
        appointmentId: payload.appointmentId,
        doctorName: payload.doctorName
      });
      toast.info(`Video call from Dr. ${payload.doctorName}`);
      loadDashboard(false);
    });

    return () => {
      [
        'appointment-accepted',
        'appointment-rejected',
        'appointment-updated',
        'appointment-cancelled',
        'report-generated',
        'prescription-received',
        'prescription-added',
        'video-call-incoming'
      ].forEach((event) => socketService.removeListener(event));
    };
  }, [user?.id]);

  const loadDashboard = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await dashboardAPI.getPatientDashboard();
      setDashboard(response.data);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to load patient dashboard');
    } finally {
      setLoading(false);
    }
  };

  const appointments = dashboard?.appointments || EMPTY_LIST;
  const upcomingAppointments = dashboard?.upcomingAppointments || EMPTY_LIST;
  const reports = dashboard?.reports || EMPTY_LIST;
  const prescriptions = dashboard?.prescriptions || EMPTY_LIST;
  const medicalHistory = dashboard?.medicalHistory || EMPTY_LIST;
  const notifications = dashboard?.notifications || EMPTY_LIST;
  const summary = dashboard?.summary || EMPTY_SUMMARY;

  const activeMedicineCount = useMemo(() => {
    return prescriptions.reduce((count, prescription) => count + (prescription.medicines?.length || 0), 0);
  }, [prescriptions]);

  const currentAppointment = upcomingAppointments[0];

  const filteredReports = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return reports;
    return reports.filter((report) => [
      report.diagnosis,
      report.doctorId?.name,
      report.appointmentId?.aiPrediction?.disease
    ].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [reports, searchTerm]);

  const handleDownloadReport = async (report) => {
    const appointmentId = report.appointmentId?._id || report.appointmentId;
    if (!appointmentId) {
      toast.error('Report is missing appointment details');
      return;
    }

    try {
      const response = await reportAPI.generateReport(appointmentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medical-report-${appointmentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to download report');
    }
  };

  const handleDownloadPrescription = async (prescription) => {
    if (!prescription?._id) {
      toast.error('Prescription is missing details');
      return;
    }

    try {
      const response = await reportAPI.generatePrescription(prescription._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription-${prescription._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Prescription downloaded');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to download prescription');
    }
  };

  const markNotificationRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await notificationAPI.markAsRead(notification._id);
      loadDashboard(false);
    } catch (error) {
      toast.error('Unable to update notification');
    }
  };

  const joinAppointmentRoom = (appointment) => {
    if (!appointment?.videoRoomId) {
      toast.info('Your doctor has not started this video consultation yet');
      return;
    }

    setVideoRoom({
      roomId: appointment.videoRoomId,
      appointmentId: appointment._id,
      doctorName: appointment.doctorId?.name
    });
  };

  const navTo = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
    setTimeout(() => {
      sectionRefs[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  if (videoRoom?.roomId) {
    return (
      <ConsultationRoom
        roomId={videoRoom.roomId}
        appointmentId={videoRoom.appointmentId}
        user={user}
        onClose={() => {
          setVideoRoom(null);
          loadDashboard(false);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="patient-shell loading-shell">
        <div className="dashboard-loader">Loading patient dashboard...</div>
      </div>
    );
  }

  return (
    <div className="patient-shell">
      <aside className={`patient-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="patient-brand">
          <div className="brand-mark"><FiHeart /></div>
          <div>
            <strong>Hospital AI</strong>
            <span>Smart Healthcare System</span>
          </div>
        </div>

        <nav className="patient-nav">
          <span className="nav-label">Main</span>
          <button className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => navTo('dashboard')}><FiHome /> Dashboard</button>
          <button className={activeSection === 'assistant' ? 'active' : ''} onClick={() => navTo('assistant')}><FiMessageCircle /> AI Assistant</button>
          <button className={activeSection === 'booking' ? 'active' : ''} onClick={() => navTo('booking')}><FiCalendar /> Book Appointment</button>
          <button className={activeSection === 'appointments' ? 'active' : ''} onClick={() => navTo('appointments')}><FiCalendar /> My Appointments</button>
          <button className={activeSection === 'payments' ? 'active' : ''} onClick={() => navTo('payments')}><FiCreditCard /> Payments</button>
          <button className={activeSection === 'video' ? 'active' : ''} onClick={() => navTo('video')}><FiVideo /> Video Consultation</button>

          <span className="nav-label">Medical</span>
          <button className={activeSection === 'reports' ? 'active' : ''} onClick={() => navTo('reports')}><FiFileText /> Reports</button>
          <button className={activeSection === 'prescriptions' ? 'active' : ''} onClick={() => navTo('prescriptions')}><FiClipboard /> Prescriptions</button>
          <button className={activeSection === 'history' ? 'active' : ''} onClick={() => navTo('history')}><FiFileText /> Medical History</button>

          <span className="nav-label">Communication</span>
          <button className={activeSection === 'notifications' ? 'active' : ''} onClick={() => navTo('notifications')}><FiBell /> Notifications <em>{summary.unreadNotifications || 0}</em></button>

          <span className="nav-label">Settings</span>
          <button className={activeSection === 'profile' ? 'active' : ''} onClick={() => navTo('profile')}><FiSettings /> Profile Settings</button>
          <button className="logout-link" onClick={onLogout}><FiLogOut /> Logout</button>
        </nav>
      </aside>
      {sidebarOpen && <button className="sidebar-overlay" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}

      <main className="patient-main">
        <header className="patient-topbar">
          <button className="menu-button" onClick={() => setSidebarOpen((value) => !value)}><FiMenu /></button>
          <div>
            <h1>Patient Dashboard</h1>
            <p>Welcome back, {user?.name || 'Patient'}</p>
          </div>
          <div className="topbar-actions">
            <label className="patient-search">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search reports, appointments..."
              />
              <FiSearch />
            </label>
            <button className="bell-button" onClick={toggleTheme}>{theme === 'dark' ? <FiSun /> : <FiMoon />}</button>
            <button className="bell-button" onClick={() => navTo('notifications')}><FiBell /><span>{summary.unreadNotifications || 0}</span></button>
            <div className="patient-profile">
              <div className="patient-avatar">{getInitials(user?.name)}</div>
              <div>
                <strong>{user?.name || 'Patient'}</strong>
                <span>Patient</span>
              </div>
            </div>
          </div>
        </header>

        <section className="metric-grid dashboard-section" ref={sectionRefs.dashboard}>
          <MetricCard icon={<FiCalendar />} color="purple" label="Upcoming Appointments" value={summary.upcomingAppointments || 0} note={`${appointments.length} total visits`} />
          <MetricCard icon={<FiFileText />} color="green" label="Medical Reports" value={summary.medicalReports || reports.length} note="MongoDB reports" />
          <MetricCard icon={<FiClipboard />} color="orange" label="Active Prescriptions" value={summary.activePrescriptions || activeMedicineCount} note={`${prescriptions.length} prescription records`} />
          <MetricCard icon={<FiHeart />} color="pink" label="Health Score" value={`${summary.healthScore || 0}%`} note={(summary.healthScore || 0) >= 80 ? 'Good' : 'Needs attention'} />
          <MetricCard icon={<FiBell />} color="blue" label="Unread Notifications" value={summary.unreadNotifications || 0} note="Live updates enabled" />
        </section>

        <section className="patient-grid">
          <div className="patient-panel assistant-panel dashboard-section" ref={sectionRefs.assistant}>
            <PanelHeader title="AI Health Assistant" />
            <SmartChatbot userId={user?.id} />
          </div>

          <div className="patient-panel quick-panel">
            <PanelHeader title="Quick Actions" />
            <div className="quick-grid">
              <QuickAction icon={<FiCalendar />} tone="green" title="Book Appointment" onClick={() => navTo('booking')} />
              <QuickAction icon={<FiVideo />} tone="blue" title="Join Consultation" onClick={() => currentAppointment ? joinAppointmentRoom(currentAppointment) : toast.info('No upcoming video consultation')} />
              <QuickAction icon={<FiDownload />} tone="orange" title="Download Reports" onClick={() => reports[0] ? handleDownloadReport(reports[0]) : toast.info('No reports available')} />
              <QuickAction icon={<FiClipboard />} tone="pink" title="View Prescriptions" onClick={() => navTo('prescriptions')} />
              <QuickAction icon={<FiFileText />} tone="cyan" title="Medical History" onClick={() => navTo('history')} />
            </div>
          </div>

          <div className="patient-panel appointment-panel dashboard-section" ref={sectionRefs.appointments}>
            <PanelHeader title="Upcoming Appointment" action="View All" onAction={() => navTo('appointments')} />
            {currentAppointment ? (
              <AppointmentCard appointment={currentAppointment} onVideo={() => joinAppointmentRoom(currentAppointment)} />
            ) : (
              <EmptyPanel text="No upcoming appointments" action="Book Appointment" onAction={() => navTo('booking')} />
            )}
          </div>

          <div className="patient-panel list-panel dashboard-section" ref={sectionRefs.reports}>
            <PanelHeader title="Reports" action="View All" onAction={() => navTo('reports')} />
            {(activeSection === 'reports' ? filteredReports : filteredReports.slice(0, 4)).map((report) => (
              <ReportRow key={report._id} report={report} onDownload={() => handleDownloadReport(report)} />
            ))}
            {filteredReports.length === 0 && <EmptyPanel text="No reports available yet" />}
          </div>

          <div className="patient-panel list-panel dashboard-section" ref={sectionRefs.prescriptions}>
            <PanelHeader title="Active Prescriptions" action="View All" onAction={() => navTo('prescriptions')} />
            {(activeSection === 'prescriptions' ? prescriptions : prescriptions.slice(0, 4)).flatMap((prescription) =>
              (prescription.medicines || []).map((medicine, index) => (
                <PrescriptionRow
                  key={`${prescription._id}-${index}`}
                  prescription={prescription}
                  medicine={medicine}
                  onDownload={() => handleDownloadPrescription(prescription)}
                />
              ))
            )}
            {prescriptions.length === 0 && <EmptyPanel text="No active prescriptions" />}
          </div>

          <div className="patient-panel history-panel dashboard-section" ref={sectionRefs.history}>
            <PanelHeader title="Medical History Timeline" action="View All" onAction={() => navTo('history')} />
            {(activeSection === 'history' ? medicalHistory : medicalHistory.slice(0, 5)).map((item) => (
              <HistoryItem key={item._id} item={item} />
            ))}
            {medicalHistory.length === 0 && <EmptyPanel text="No medical history yet" />}
          </div>

          <div className="patient-panel health-panel">
            <PanelHeader title="Health Summary" />
            <div className="health-content">
              <div className="health-cards">
                <HealthTile label="Visits" value={appointments.filter((item) => item.status === 'completed').length} note="Completed" />
                <HealthTile label="Reports" value={reports.length} note="Generated" />
                <HealthTile label="Medicines" value={activeMedicineCount} note="Active" />
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={dashboard?.chartData?.healthProgress || []}>
                  <XAxis dataKey="month" stroke="#718096" />
                  <YAxis stroke="#718096" domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#4e45d8" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="patient-panel notifications-panel dashboard-section" ref={sectionRefs.notifications}>
            <PanelHeader title="Notifications" action="View All" />
            {notifications.map((notification) => (
              <button
                key={notification._id}
                className={`notification-row ${notification.isRead ? '' : 'unread'}`}
                onClick={() => markNotificationRead(notification)}
              >
                <span><FiBell /></span>
                <div>
                  <strong>{notification.title || 'Notification'}</strong>
                  <small>{notification.message}</small>
                </div>
                <time>{formatTimeAgo(notification.createdAt)}</time>
              </button>
            ))}
            {notifications.length === 0 && <EmptyPanel text="No notifications" />}
          </div>

          {activeSection === 'appointments' && (
            <div className="patient-panel full-panel">
              <PanelHeader title="All Appointments" />
              {appointments.map((appointment) => (
                <AppointmentRow key={appointment._id} appointment={appointment} onVideo={() => joinAppointmentRoom(appointment)} />
              ))}
              {appointments.length === 0 && <EmptyPanel text="No appointments booked yet" action="Book Appointment" onAction={() => navTo('booking')} />}
            </div>
          )}

          <div className="patient-panel full-panel dashboard-section" ref={sectionRefs.booking}>
            <PanelHeader title="Book Appointment" />
            <AppointmentBooking
              userId={user?.id}
              onBookingComplete={() => {
                loadDashboard(false);
                navTo('appointments');
              }}
            />
          </div>

          <div className="patient-panel full-panel dashboard-section" ref={sectionRefs.payments}>
            <PanelHeader title="Payments" />
            <PaymentPanel user={user} appointments={appointments} mode="patient" onRefresh={() => loadDashboard(false)} />
          </div>

          <div className="patient-panel full-panel dashboard-section" ref={sectionRefs.video}>
              <PanelHeader title="Video Consultation Rooms" />
              {upcomingAppointments.map((appointment) => (
                <AppointmentRow key={appointment._id} appointment={appointment} onVideo={() => joinAppointmentRoom(appointment)} />
              ))}
              {upcomingAppointments.length === 0 && <EmptyPanel text="No active video rooms" />}
            </div>

          <div className="patient-panel full-panel dashboard-section" ref={sectionRefs.profile}>
            <PanelHeader title="Profile" />
            <EmptyPanel text="Profile editing is available through the protected profile API and can be expanded here without leaving the dashboard." />
          </div>
        </section>
      </main>

      <ToastContainer position="bottom-right" autoClose={2500} />
    </div>
  );
};

const getInitials = (name = 'Patient') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

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

const QuickAction = ({ icon, tone, title, onClick }) => (
  <button className="quick-action" onClick={onClick}>
    <span className={tone}>{icon}</span>
    <strong>{title}</strong>
  </button>
);

const EmptyPanel = ({ text, action, onAction }) => (
  <div className="empty-panel">
    <p>{text}</p>
    {action && <button onClick={onAction}>{action}</button>}
  </div>
);

const AppointmentCard = ({ appointment, onVideo }) => (
  <div className="appointment-card">
    <div className="appointment-doctor">
      <div className="patient-avatar">{getInitials(appointment.doctorId?.name || 'Doctor')}</div>
      <div>
        <strong>Dr. {appointment.doctorId?.name || 'Assigned Doctor'}</strong>
        <span>{appointment.doctorId?.specialization || 'General Physician'}</span>
      </div>
      <em className={`status-pill ${appointment.status}`}>{statusLabels[appointment.status] || appointment.status}</em>
    </div>
    <p><FiCalendar /> {formatDate(appointment.appointmentDate)}</p>
    <p>{appointment.appointmentTime || 'Time not set'}</p>
    <p>{appointment.aiPrediction?.disease || appointment.symptoms?.join(', ') || 'Consultation'}</p>
    <button onClick={onVideo}><FiVideo /> Join Video Call</button>
  </div>
);

const AppointmentRow = ({ appointment, onVideo }) => (
  <div className="appointment-row patient-appointment-row">
    <div className="patient-avatar">{getInitials(appointment.doctorId?.name || 'Doctor')}</div>
    <div>
      <strong>Dr. {appointment.doctorId?.name || 'Assigned Doctor'}</strong>
      <span>{appointment.doctorId?.specialization || appointment.aiPrediction?.recommendedDepartment || 'General'}</span>
    </div>
    <div>
      <strong>{formatDate(appointment.appointmentDate)}</strong>
      <span>{appointment.appointmentTime || 'Time not set'}</span>
    </div>
    <span className={`status-pill ${appointment.status}`}>{statusLabels[appointment.status] || appointment.status}</span>
    <button onClick={onVideo}><FiVideo /> Join</button>
  </div>
);

const ReportRow = ({ report, onDownload }) => (
  <div className="data-row">
    <span className="row-icon green"><FiFileText /></span>
    <div>
      <strong>{report.diagnosis || report.appointmentId?.aiPrediction?.disease || 'Medical Report'}</strong>
      <small>Dr. {report.doctorId?.name || 'Doctor'} · {formatDate(report.createdAt)}</small>
    </div>
    <button onClick={onDownload}><FiDownload /> PDF</button>
  </div>
);

const PrescriptionRow = ({ prescription, medicine, onDownload }) => (
  <div className="data-row">
    <span className="row-icon pink"><FiClipboard /></span>
    <div>
      <strong>{medicine.name}</strong>
      <small>{[medicine.dosage, medicine.frequency, medicine.duration, medicine.instructions].filter(Boolean).join(' · ') || prescription.advice || 'Follow doctor advice'}</small>
    </div>
    <button onClick={onDownload}><FiDownload /> PDF</button>
  </div>
);

const HistoryItem = ({ item }) => (
  <div className="history-item">
    <span />
    <div>
      <time>{formatDate(item.createdAt)}</time>
      <strong>{item.title}</strong>
      <small>{[item.type, item.diagnosis, item.createdBy?.name].filter(Boolean).join(' · ')}</small>
    </div>
    <em>{item.severity || 'Updated'}</em>
  </div>
);

const HealthTile = ({ label, value, note }) => (
  <div className="health-tile">
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
  </div>
);

export default PatientDashboard;
