import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiMenu, FiMoon, FiSun } from 'react-icons/fi';
import GlobalPatientSearch from './GlobalPatientSearch';

const getInitials = (name = 'DR') => name
  .split(' ')
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

const routeTitles = {
  '/doctor/dashboard': ['Doctor Dashboard', 'Overview of today, patients, payments, and consultations'],
  '/doctor/appointments': ['Appointments', 'Manage assigned appointment requests'],
  '/doctor/patients': ['Patients', 'Review assigned patient records'],
  '/doctor/consultations': ['Consultations', 'Track active and completed consultations'],
  '/doctor/video-consultation': ['Video Consultation', 'Start appointment-based consultation rooms'],
  '/doctor/payments': ['Payments', 'Verify UPI payment requests'],
  '/doctor/prescriptions': ['Prescriptions', 'Create prescriptions linked to appointments'],
  '/doctor/reports': ['Reports', 'Generate consultation reports'],
  '/doctor/medical-history': ['Medical History', 'Shared patient history timeline'],
  '/doctor/messages': ['Messages', 'Doctor-patient conversations'],
  '/doctor/notifications': ['Notifications', 'Real-time care updates'],
  '/doctor/profile': ['Profile', 'Doctor profile and professional information'],
  '/doctor/settings': ['Settings', 'Workspace preferences and availability']
};

const DoctorTopbar = ({ doctor, unreadCount = 0, onMenuClick, theme, onToggleTheme, onPatientSelect }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [title, subtitle] = routeTitles[location.pathname] || routeTitles['/doctor/dashboard'];

  return (
    <header className="doctor-topbar route-topbar">
      <div className="topbar-left">
        <button className="menu-button" type="button" onClick={onMenuClick} aria-label="Open menu">
          <FiMenu />
        </button>
        <div>
          <h1>{title}</h1>
          <p>Welcome back, Dr. {doctor.name || 'Doctor'} - {subtitle}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <GlobalPatientSearch
          onSelect={(patient) => {
            onPatientSelect?.(patient);
            navigate('/doctor/patients');
          }}
        />
        <button className="bell-button" type="button" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </button>
        <button className="bell-button" type="button" onClick={() => navigate('/doctor/notifications')} aria-label="Notifications">
          <FiBell />
          {unreadCount > 0 && <span>{unreadCount}</span>}
        </button>
        <div className="doctor-profile">
          <div className="doctor-avatar">{getInitials(doctor.name || 'Dr')}</div>
          <div>
            <strong>Dr. {doctor.name || 'Doctor'}</strong>
            <span>{doctor.specialization || 'General Physician'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DoctorTopbar;
