import React, { useEffect, useMemo, useState } from 'react';
import {
  FiBell,
  FiCalendar,
  FiClipboard,
  FiCreditCard,
  FiDownload,
  FiFileText,
  FiHeart,
  FiHome,
  FiLogOut,
  FiMessageCircle,
  FiMenu,
  FiSearch,
  FiSettings,
  FiVideo
} from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './PatientDashboard.css';
import { dashboardAPI, notificationAPI, reportAPI } from '../utils/api';
import socketService from '../utils/socket';
import AIChat from './AIChat';
import AppointmentBooking from './AppointmentBooking';
import ConsultationRoom from './ConsultationRoom';
import PaymentPanel from './PaymentPanel';

const EMPTY = [];
const EMPTY_SUMMARY = {};
const routeToPage = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/appointments': 'book',
  '/my-appointments': 'appointments',
  '/video-consultation': 'video',
  '/reports': 'reports',
  '/prescriptions': 'prescriptions',
  '/medical-history': 'history',
  '/ai-assistant': 'assistant',
  '/payments': 'payments',
  '/profile': 'profile',
  '/notifications': 'notifications'
};
const pageToRoute = {
  dashboard: '/dashboard',
  book: '/appointments',
  appointments: '/my-appointments',
  video: '/video-consultation',
  reports: '/reports',
  prescriptions: '/prescriptions',
  history: '/medical-history',
  assistant: '/ai-assistant',
  payments: '/payments',
  profile: '/profile',
  notifications: '/notifications'
};
const statusLabels = {
  pending: 'Pending',
  scheduled: 'Scheduled',
  accepted: 'Confirmed',
  rejected: 'Rejected',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const getInitials = (name = 'Patient') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not scheduled';
const timeAgo = (date) => {
  if (!date) return 'Just now';
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours} hr ago` : `${Math.floor(hours / 24)} day ago`;
};

const PatientShell = ({ user, onLogout }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(() => routeToPage[window.location.pathname] || 'dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [videoRoom, setVideoRoom] = useState(null);

  const appointments = data?.appointments || EMPTY;
  const upcoming = data?.upcomingAppointments || EMPTY;
  const reports = data?.reports || EMPTY;
  const prescriptions = data?.prescriptions || EMPTY;
  const history = data?.medicalHistory || EMPTY;
  const notifications = data?.notifications || EMPTY;
  const summary = data?.summary || EMPTY_SUMMARY;

  const medicineCount = useMemo(() => prescriptions.reduce((sum, item) => sum + (item.medicines?.length || 0), 0), [prescriptions]);
  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) => [report.diagnosis, report.doctorId?.name].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [reports, search]);

  useEffect(() => {
    const syncRoute = () => setPage(routeToPage[window.location.pathname] || 'dashboard');
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    socketService.connect();
    if (user?.id) socketService.patientLogin(user.id);
    const refresh = (message) => {
      if (message) toast.info(message);
      loadDashboard(false);
    };
    socketService.on('appointment-accepted', () => refresh('Appointment confirmed'));
    socketService.on('appointment-rejected', () => refresh('Appointment rejected'));
    socketService.on('appointment-updated', () => refresh('Appointment updated'));
    socketService.on('report-generated', () => refresh('New report available'));
    socketService.on('prescription-added', () => refresh('New prescription available'));
    socketService.on('prescription-received', () => refresh('New prescription available'));
    socketService.on('video-call-incoming', (payload) => {
      setVideoRoom({ roomId: payload.videoRoomId, appointmentId: payload.appointmentId });
      refresh(`Video call from Dr. ${payload.doctorName}`);
    });
    return () => ['appointment-accepted', 'appointment-rejected', 'appointment-updated', 'report-generated', 'prescription-added', 'prescription-received', 'video-call-incoming'].forEach((event) => socketService.removeListener(event));
  }, [user?.id]);

  const loadDashboard = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await dashboardAPI.getPatientDashboard();
      setData(response.data);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to load patient dashboard');
    } finally {
      setLoading(false);
    }
  };

  const navTo = (nextPage) => {
    setPage(nextPage);
    setMenuOpen(false);
    window.history.pushState(null, '', pageToRoute[nextPage] || '/dashboard');
  };

  const download = async (request, filename) => {
    try {
      const response = await request();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Download failed');
    }
  };

  const joinVideo = (appointment) => {
    if (!appointment?.videoRoomId) return toast.info('Your doctor has not started this video consultation yet');
    setVideoRoom({ roomId: appointment.videoRoomId, appointmentId: appointment._id });
  };

  const markRead = async (notification) => {
    if (notification.isRead) return;
    await notificationAPI.markAsRead(notification._id).then(() => loadDashboard(false)).catch(() => toast.error('Unable to update notification'));
  };

  if (videoRoom?.roomId) {
    return <ConsultationRoom roomId={videoRoom.roomId} appointmentId={videoRoom.appointmentId} user={user} onClose={() => { setVideoRoom(null); loadDashboard(false); }} />;
  }

  if (loading) {
    return <div className="patient-shell loading-shell"><div className="dashboard-loader">Loading patient dashboard...</div></div>;
  }

  const renderPage = () => {
    if (page === 'assistant') return <Page title="AI Assistant" wide><AIChat userId={user?.id} /></Page>;
    if (page === 'book') return <Page title="Book Appointment" wide><AppointmentBooking userId={user?.id} onBookingComplete={() => { loadDashboard(false); navTo('appointments'); }} /></Page>;
    if (page === 'payments') return <Page title="Payments" wide><PaymentPanel user={user} appointments={appointments} mode="patient" onRefresh={() => loadDashboard(false)} /></Page>;
    if (page === 'video') return <Page title="Video Consultation"><List items={upcoming} empty="No active video rooms">{(item) => <AppointmentRow appointment={item} onVideo={() => joinVideo(item)} />}</List></Page>;
    if (page === 'appointments') return <Page title="My Appointments"><List items={appointments} empty="No appointments booked yet">{(item) => <AppointmentRow appointment={item} onVideo={() => joinVideo(item)} />}</List></Page>;
    if (page === 'reports') return <Page title="Reports"><List items={filteredReports} empty="No reports available">{(item) => <ReportRow report={item} onDownload={() => download(() => reportAPI.generateReport(item.appointmentId?._id || item.appointmentId), `medical-report-${item._id}.pdf`)} />}</List></Page>;
    if (page === 'prescriptions') {
      const rows = prescriptions.flatMap((prescription) => (prescription.medicines || []).map((medicine, index) => ({ id: `${prescription._id}-${index}`, prescription, medicine })));
      return <Page title="Prescriptions"><List items={rows} empty="No active prescriptions">{(item) => <PrescriptionRow item={item} onDownload={() => download(() => reportAPI.generatePrescription(item.prescription._id), `prescription-${item.prescription._id}.pdf`)} />}</List></Page>;
    }
    if (page === 'history') return <Page title="Medical History"><List items={history} empty="No medical history yet">{(item) => <HistoryRow item={item} />}</List></Page>;
    if (page === 'notifications') return <Page title="Notifications"><List items={notifications} empty="No notifications">{(item) => <NotificationRow notification={item} onClick={() => markRead(item)} />}</List></Page>;
    if (page === 'profile') return <Page title="Profile"><div className="profile-summary"><div className="patient-avatar large">{getInitials(user?.name)}</div><div><strong>{user?.name}</strong><span>{user?.email}</span><span>{user?.phone || 'No phone added'}</span></div></div></Page>;

    return (
      <>
        <section className="patient-welcome">
          <div><span>Welcome back</span><h1>{user?.name || 'Patient'}</h1><p>Your latest care updates, appointments and billing are ready.</p></div>
          <button onClick={() => navTo('book')}><FiCalendar /> Book Appointment</button>
        </section>
        <section className="metric-grid">
          <MetricCard icon={<FiCalendar />} color="purple" label="Upcoming" value={summary.upcomingAppointments || 0} note={`${appointments.length} total visits`} />
          <MetricCard icon={<FiFileText />} color="green" label="Reports" value={summary.medicalReports || reports.length} note="Ready documents" />
          <MetricCard icon={<FiClipboard />} color="orange" label="Medicines" value={summary.activePrescriptions || medicineCount} note="Active prescriptions" />
          <MetricCard icon={<FiHeart />} color="pink" label="Health Score" value={`${summary.healthScore || 0}%`} note="Current score" />
          <MetricCard icon={<FiBell />} color="blue" label="Unread" value={summary.unreadNotifications || 0} note="Notifications" />
        </section>
        <section className="patient-grid overview-grid">
          <Page title="Recent Appointments"><List items={upcoming.slice(0, 3)} empty="No upcoming appointments">{(item) => <AppointmentRow appointment={item} onVideo={() => joinVideo(item)} />}</List></Page>
          <Page title="Recent Reports"><List items={reports.slice(0, 4)} empty="No reports available">{(item) => <ReportRow report={item} onDownload={() => download(() => reportAPI.generateReport(item.appointmentId?._id || item.appointmentId), `medical-report-${item._id}.pdf`)} />}</List></Page>
          <Page title="Quick Actions"><div className="quick-grid"><QuickAction icon={<FiCalendar />} title="Book" onClick={() => navTo('book')} /><QuickAction icon={<FiVideo />} title="Video" onClick={() => navTo('video')} /><QuickAction icon={<FiCreditCard />} title="Pay" onClick={() => navTo('payments')} /><QuickAction icon={<FiMessageCircle />} title="AI Chat" onClick={() => navTo('assistant')} /></div></Page>
          <Page title="Notifications"><List items={notifications.slice(0, 5)} empty="No notifications">{(item) => <NotificationRow notification={item} onClick={() => markRead(item)} />}</List></Page>
        </section>
      </>
    );
  };

  return (
    <div className="patient-shell">
      <aside className={`patient-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="patient-brand"><div className="brand-mark"><FiHeart /></div><div><strong>Hospital AI</strong><span>Smart Healthcare System</span></div></div>
        <nav className="patient-nav">
          <span className="nav-label">Main</span>
          <Nav active={page === 'dashboard'} icon={<FiHome />} label="Dashboard" onClick={() => navTo('dashboard')} />
          <Nav active={page === 'assistant'} icon={<FiMessageCircle />} label="AI Assistant" onClick={() => navTo('assistant')} />
          <Nav active={page === 'book'} icon={<FiCalendar />} label="Book Appointment" onClick={() => navTo('book')} />
          <Nav active={page === 'appointments'} icon={<FiCalendar />} label="My Appointments" onClick={() => navTo('appointments')} />
          <Nav active={page === 'video'} icon={<FiVideo />} label="Video Consultation" onClick={() => navTo('video')} />
          <span className="nav-label">Medical</span>
          <Nav active={page === 'reports'} icon={<FiFileText />} label="Reports" onClick={() => navTo('reports')} />
          <Nav active={page === 'prescriptions'} icon={<FiClipboard />} label="Prescriptions" onClick={() => navTo('prescriptions')} />
          <Nav active={page === 'history'} icon={<FiFileText />} label="Medical History" onClick={() => navTo('history')} />
          <span className="nav-label">Billing</span>
          <Nav active={page === 'payments'} icon={<FiCreditCard />} label="Payments" onClick={() => navTo('payments')} />
          <span className="nav-label">Settings</span>
          <Nav active={page === 'notifications'} icon={<FiBell />} label="Notifications" badge={summary.unreadNotifications || 0} onClick={() => navTo('notifications')} />
          <Nav active={page === 'profile'} icon={<FiSettings />} label="Profile" onClick={() => navTo('profile')} />
          <button className="logout-link" onClick={onLogout}><FiLogOut /> Logout</button>
        </nav>
      </aside>
      {menuOpen && <button className="sidebar-overlay" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <main className="patient-main">
        <header className="patient-topbar">
          <button className="menu-button" onClick={() => setMenuOpen((value) => !value)}><FiMenu /></button>
          <div><h1>{page === 'dashboard' ? 'Patient Dashboard' : pageLabel(page)}</h1><p>Welcome back, {user?.name || 'Patient'}</p></div>
          <div className="topbar-actions">
            <label className="patient-search"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports, appointments..." /><FiSearch /></label>
            <button className="bell-button" onClick={() => navTo('notifications')}><FiBell /><span>{summary.unreadNotifications || 0}</span></button>
            <div className="patient-profile"><div className="patient-avatar">{getInitials(user?.name)}</div><div><strong>{user?.name || 'Patient'}</strong><span>Patient</span></div></div>
          </div>
        </header>
        <div className="patient-page-content">{renderPage()}</div>
      </main>
      <ToastContainer position="bottom-right" autoClose={2500} />
    </div>
  );
};

const pageLabel = (page) => ({
  assistant: 'AI Assistant',
  book: 'Book Appointment',
  appointments: 'My Appointments',
  video: 'Video Consultation',
  reports: 'Reports',
  prescriptions: 'Prescriptions',
  history: 'Medical History',
  payments: 'Payments',
  notifications: 'Notifications',
  profile: 'Profile'
}[page] || 'Dashboard');

const Nav = ({ active, icon, label, badge, onClick }) => <button className={active ? 'active' : ''} onClick={onClick}>{icon} {label}{badge !== undefined && <em>{badge}</em>}</button>;
const Page = ({ title, children, wide }) => <section className={`patient-panel page-panel ${wide ? 'wide-panel' : ''}`}><PanelHeader title={title} />{children}</section>;
const PanelHeader = ({ title }) => <div className="panel-header"><h2>{title}</h2></div>;
const List = ({ items, empty, children }) => <div className="page-list">{items.length ? items.map((item) => <React.Fragment key={item._id || item.id}>{children(item)}</React.Fragment>) : <EmptyPanel text={empty} />}</div>;
const EmptyPanel = ({ text }) => <div className="empty-panel"><p>{text}</p></div>;
const MetricCard = ({ icon, color, label, value, note }) => <article className="metric-card"><div className={`metric-icon ${color}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
const QuickAction = ({ icon, title, onClick }) => <button className="quick-action" onClick={onClick}><span>{icon}</span><strong>{title}</strong></button>;
const AppointmentRow = ({ appointment, onVideo }) => <div className="appointment-row patient-appointment-row"><div className="patient-avatar">{getInitials(appointment.doctorId?.name || 'Doctor')}</div><div><strong>Dr. {appointment.doctorId?.name || 'Assigned Doctor'}</strong><span>{appointment.doctorId?.specialization || appointment.aiPrediction?.recommendedDepartment || 'General'}</span></div><div><strong>{formatDate(appointment.appointmentDate)}</strong><span>{appointment.appointmentTime || 'Time not set'}</span></div><span className={`status-pill ${appointment.status}`}>{statusLabels[appointment.status] || appointment.status}</span><button onClick={onVideo}><FiVideo /> Join</button></div>;
const ReportRow = ({ report, onDownload }) => <div className="data-row"><span className="row-icon green"><FiFileText /></span><div><strong>{report.diagnosis || report.appointmentId?.aiPrediction?.disease || 'Medical Report'}</strong><small>Dr. {report.doctorId?.name || 'Doctor'} · {formatDate(report.createdAt)}</small></div><button onClick={onDownload}><FiDownload /> PDF</button></div>;
const PrescriptionRow = ({ item, onDownload }) => <div className="data-row"><span className="row-icon pink"><FiClipboard /></span><div><strong>{item.medicine.name}</strong><small>{[item.medicine.dosage, item.medicine.frequency, item.medicine.duration, item.medicine.instructions].filter(Boolean).join(' · ') || item.prescription.advice || 'Follow doctor advice'}</small></div><button onClick={onDownload}><FiDownload /> PDF</button></div>;
const HistoryRow = ({ item }) => <div className="history-item"><span /><div><time>{formatDate(item.createdAt)}</time><strong>{item.title}</strong><small>{[item.type, item.diagnosis, item.createdBy?.name].filter(Boolean).join(' · ')}</small></div><em>{item.severity || 'Updated'}</em></div>;
const NotificationRow = ({ notification, onClick }) => <button className={`notification-row ${notification.isRead ? '' : 'unread'}`} onClick={onClick}><span><FiBell /></span><div><strong>{notification.title || 'Notification'}</strong><small>{notification.message}</small></div><time>{timeAgo(notification.createdAt)}</time></button>;

export default PatientShell;
