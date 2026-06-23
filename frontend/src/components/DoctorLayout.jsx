import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DoctorSidebar from './DoctorSidebar';
import DoctorTopbar from './DoctorTopbar';

const DoctorLayout = ({ context, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`doctor-shell route-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <DoctorSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        onLogout={onLogout}
        unreadCount={context.unreadCount}
        messageCount={context.messageCount}
      />

      <main className="doctor-main route-main">
        <DoctorTopbar
          doctor={context.doctor}
          unreadCount={context.unreadCount}
          onMenuClick={() => setMobileOpen(true)}
          theme={context.theme}
          onToggleTheme={context.toggleTheme}
          onPatientSelect={(patient) => context.setSearchTerm(patient.name || patient.email || '')}
        />

        <Outlet context={context} />
      </main>
    </div>
  );
};

export default DoctorLayout;
