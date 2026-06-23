import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiActivity,
  FiBell,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiLogOut,
  FiMessageCircle,
  FiSettings,
  FiUser,
  FiUsers,
  FiVideo,
  FiX
} from 'react-icons/fi';

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/doctor/dashboard', icon: <FiHome />, label: 'Dashboard' },
      { to: '/doctor/appointments', icon: <FiCalendar />, label: 'Appointments' },
      { to: '/doctor/patients', icon: <FiUsers />, label: 'Patients' },
      { to: '/doctor/consultations', icon: <FiActivity />, label: 'Consultations' },
      { to: '/doctor/video-consultation', icon: <FiVideo />, label: 'Video Call' }
    ]
  },
  {
    label: 'Medical',
    items: [
      { to: '/doctor/reports', icon: <FiFileText />, label: 'Reports' },
      { to: '/doctor/prescriptions', icon: <FiClipboard />, label: 'Prescriptions' },
      { to: '/doctor/medical-history', icon: <FiFileText />, label: 'Medical History' }
    ]
  },
  {
    label: 'Communication',
    items: [
      { to: '/doctor/messages', icon: <FiMessageCircle />, label: 'Messages', badgeKey: 'messages' },
      { to: '/doctor/notifications', icon: <FiBell />, label: 'Notifications', badgeKey: 'notifications' },
      { to: '/doctor/payments', icon: <FiCreditCard />, label: 'Payments' }
    ]
  },
  {
    label: 'Account',
    items: [
      { to: '/doctor/profile', icon: <FiUser />, label: 'Profile' },
      { to: '/doctor/settings', icon: <FiSettings />, label: 'Settings' }
    ]
  }
];

const DoctorSidebar = ({
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
  onToggleCollapse,
  onLogout,
  unreadCount = 0,
  messageCount = 0
}) => {
  const badgeValue = (key) => {
    if (key === 'notifications') return unreadCount;
    if (key === 'messages') return messageCount;
    return 0;
  };

  return (
    <>
      <aside className={`doctor-sidebar route-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        <div className="doctor-brand">
          <div className="brand-mark"><FiClipboard /></div>
          <div className="brand-copy">
            <strong>Hospital AI</strong>
            <span>Doctor Workspace</span>
          </div>
          <button className="mobile-close" type="button" onClick={onCloseMobile} aria-label="Close menu">
            <FiX />
          </button>
        </div>

        <button className="collapse-button" type="button" onClick={onToggleCollapse} aria-label="Toggle sidebar">
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>

        <nav className="doctor-nav route-nav" aria-label="Doctor navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-label">{group.label}</span>
              {group.items.map((item) => {
                const badge = badgeValue(item.badgeKey);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    className={({ isActive }) => (isActive ? 'active' : undefined)}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {badge > 0 && <em>{badge}</em>}
                  </NavLink>
                );
              })}
            </div>
          ))}

          <button className="logout-link" type="button" onClick={onLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
      {mobileOpen && <button className="sidebar-overlay" type="button" aria-label="Close menu" onClick={onCloseMobile} />}
    </>
  );
};

export default DoctorSidebar;
