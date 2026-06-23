import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import './AdvancedDashboard.css';
import { dashboardAPI } from '../utils/api';

const AdvancedDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    setLoading(true);
    dashboardAPI.getAdvancedAnalytics()
      .then(response => {
        setAnalytics(response.data);
        toast.success('✓ Dashboard updated');
      })
      .catch(error => {
        console.error('Dashboard Error:', error?.response?.data || error?.message || error);
        const errorMsg = error?.response?.data?.error || error?.message || 'Error loading analytics';
        toast.error(`❌ ${errorMsg}`);
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return <div className="loading-spinner">Loading Analytics...</div>;
  }

  if (!analytics) {
    return <div className="error-message">Failed to load analytics</div>;
  }

  return (
    <div className="advanced-dashboard">
      <div className="dashboard-header">
        <h1>📊 Advanced Analytics Dashboard</h1>
        <button className="refresh-btn" onClick={loadAnalytics}>🔄 Refresh</button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card total-appointments">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>Total Appointments</h3>
            <p className="card-value">{analytics.summary.totalAppointments}</p>
          </div>
        </div>

        <div className="card today-appointments">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>Today's Appointments</h3>
            <p className="card-value">{analytics.summary.appointmentsToday}</p>
          </div>
        </div>

        <div className="card emergency">
          <div className="card-icon">🚨</div>
          <div className="card-content">
            <h3>Emergency Cases</h3>
            <p className="card-value">{analytics.summary.emergencyCount}</p>
          </div>
        </div>

        <div className="card patients">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Total Patients</h3>
            <p className="card-value">{analytics.summary.totalPatients}</p>
          </div>
        </div>

        <div className="card doctors">
          <div className="card-icon">👨‍⚕️</div>
          <div className="card-content">
            <h3>Total Doctors</h3>
            <p className="card-value">{analytics.summary.totalDoctors}</p>
          </div>
        </div>

        <div className="card rating">
          <div className="card-icon">⭐</div>
          <div className="card-content">
            <h3>Avg Rating</h3>
            <p className="card-value">{analytics.summary.averageRating.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Appointments Per Day Chart */}
        <div className="chart-container">
          <h3>📈 Appointments Per Day (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.chartData.appointmentsPerDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="appointments" 
                stroke="#667eea" 
                strokeWidth={2}
                dot={{ fill: '#667eea', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Disease Distribution */}
        <div className="chart-container">
          <h3>🦠 Most Common Diseases</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.chartData.diseaseBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#764ba2" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="chart-container">
          <h3>🏥 Department Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.chartData.departmentBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.chartData.departmentBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Disease Statistics Table */}
        <div className="chart-container">
          <h3>📋 Disease Statistics</h3>
          <div className="table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Disease</th>
                  <th>Cases</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {analytics.mostCommonDiseases.map((disease, idx) => (
                  <tr key={idx}>
                    <td>{disease.disease}</td>
                    <td>{disease.count}</td>
                    <td>
                      {(
                        (disease.count / analytics.summary.totalAppointments) * 100
                      ).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Statistics */}
        <div className="chart-container">
          <h3>🏨 Department Performance</h3>
          <div className="table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Appointments</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {analytics.departmentStats.map((dept, idx) => (
                  <tr key={idx}>
                    <td>{dept.department}</td>
                    <td>{dept.appointmentCount}</td>
                    <td>
                      {(
                        (dept.appointmentCount / analytics.summary.totalAppointments) * 100
                      ).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor Workload */}
        <div className="chart-container">
          <h3>👨‍⚕️ Doctor Workload Status</h3>
          <div className="workload-list">
            {analytics.doctorWorkload.map((doc, idx) => (
              <div key={idx} className="workload-item">
                <div className="doctor-info">
                  <strong>{doc.name}</strong>
                  <span className="specialization">{doc.specialization}</span>
                </div>
                <div className="workload-bar">
                  <div className="workload-fill" style={{ width: `${Math.min(doc.workload * 10, 100)}%` }}>
                    {doc.workload}
                  </div>
                </div>
                <span className="rating">⭐ {doc.rating.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default AdvancedDashboard;
