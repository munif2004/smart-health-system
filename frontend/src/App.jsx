import React, { useEffect, useState } from 'react';
import './App.css';
import './components/DashboardLayout.css';
import socketService from './utils/socket';
import AppointmentBooking from './components/AppointmentBooking';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DoctorDashboard from './components/DoctorDashboard';
import PatientShell from './components/PatientShell';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');

  useEffect(() => {
    socketService.connect();

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setCurrentPage(parsedUser.role === 'patient' ? 'dashboard' : 'home');
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('login');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage(userData.role === 'patient' ? 'dashboard' : 'home');
  };

  if (user?.role === 'doctor') {
    return <ThemeProvider><DoctorDashboard user={user} onLogout={handleLogout} /></ThemeProvider>;
  }

  return (
    <ThemeProvider>
      <div className="App">
        <main className="app-main">
          {!user ? (
            currentPage === 'register' ? (
              <RegisterPage
                onRegisterSuccess={() => setCurrentPage('login')}
                onSwitchToLogin={() => setCurrentPage('login')}
              />
            ) : (
              <LoginPage
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={() => setCurrentPage('register')}
              />
            )
          ) : currentPage === 'booking' ? (
            <AppointmentBooking
              userId={user.id}
              onBookingComplete={() => setCurrentPage('dashboard')}
            />
          ) : (
            <PatientShell
              user={user}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
