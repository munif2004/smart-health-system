import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AuthPage.css';
import { authAPI } from '../utils/api';

const LoginPage = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('patient');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const loginFn = loginRole === 'doctor' ? authAPI.doctorLogin : authAPI.patientLogin;
      const response = await loginFn({ email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Login successful');
      onLoginSuccess?.(user);
    } catch (error) {
      const errorMsg = error?.response?.data?.error || error?.message || 'Login failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Smart AI Health</h2>
            <p>{loginRole === 'doctor' ? 'Doctor Login' : 'Patient Login'}</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="role-toggle" aria-label="Choose login type">
              <button
                type="button"
                className={loginRole === 'patient' ? 'active' : ''}
                onClick={() => setLoginRole('patient')}
                disabled={loading}
              >
                Patient
              </button>
              <button
                type="button"
                className={loginRole === 'doctor' ? 'active' : ''}
                onClick={() => setLoginRole('doctor')}
                disabled={loading}
              >
                Doctor
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : `Login as ${loginRole}`}
            </button>
          </form>

          <div className="auth-footer">
            <p>Do not have an account?</p>
            <button type="button" className="btn-link" onClick={onSwitchToRegister} disabled={loading}>
              Create one here
            </button>
          </div>

          <div className="test-credentials">
            <p><strong>Test Credentials:</strong></p>
            <p>Patient: patient@hospital.ai / Patient@123</p>
            <p>Doctor: doctor@hospital.ai / Doctor@123</p>
          </div>
        </div>
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default LoginPage;
