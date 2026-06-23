import React, { createRef, useMemo } from 'react';
import './DashboardLayout.css';

const DashboardLayout = ({
  shellClassName,
  sidebarClassName,
  mainClassName,
  sidebarOpen,
  brand,
  navItems,
  activeSection,
  onSectionChange,
  topbar,
  children
}) => {
  const refs = useMemo(() => {
    return navItems.reduce((map, item) => {
      map[item.id] = createRef();
      return map;
    }, {});
  }, [navItems]);

  const scrollToSection = (sectionId) => {
    onSectionChange?.(sectionId);
    refs[sectionId]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={shellClassName}>
      <aside className={`${sidebarClassName} ${sidebarOpen ? 'open' : ''}`}>
        {brand}
        <nav className="dashboard-layout-nav">
          {navItems.map((item) => (
            item.type === 'label' ? (
              <span className="nav-label" key={item.id}>{item.label}</span>
            ) : (
              <button
                key={item.id}
                className={activeSection === item.id ? 'active' : ''}
                onClick={() => item.onClick ? item.onClick() : scrollToSection(item.id)}
              >
                {item.icon} {item.label} {item.badge !== undefined && <em>{item.badge}</em>}
              </button>
            )
          ))}
        </nav>
      </aside>
      <main className={mainClassName}>
        {topbar}
        {typeof children === 'function' ? children({ refs, scrollToSection }) : children}
      </main>
    </div>
  );
};

export default DashboardLayout;
