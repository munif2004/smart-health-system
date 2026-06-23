import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import './ReportViewer.css';
import { reportAPI } from '../utils/api';

const ReportViewer = ({ userId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [userId]);

  const loadReports = () => {
    setLoading(true);
    reportAPI.getPatientReports()
      .then(response => {
        setReports(response.data || []);
      })
      .catch(err => {
        console.error('Reports Error:', err?.response?.data || err?.message);
        const errorMsg = err?.response?.data?.error || err?.message || 'Error loading reports';
        toast.error(`❌ ${errorMsg}`);
      })
      .finally(() => setLoading(false));
  };

  const handleDownloadReport = (appointmentId) => {
    reportAPI.generateReport(appointmentId)
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report-${appointmentId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        toast.success('✓ Report downloaded');
      })
      .catch(err => {
        console.error('Error:', err);
        toast.error('Error downloading report');
      });
  };

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div className="report-viewer">
      <div className="viewer-header">
        <h2>📄 Your Medical Reports</h2>
        <p>Download and view your medical reports</p>
      </div>

      {reports.length > 0 ? (
        <div className="reports-list">
          {reports.map((report) => (
            <div key={report.reportId} className="report-card">
              <div className="report-info">
                <h3>{report.disease}</h3>
                <div className="report-meta">
                  <span className={`severity ${report.severity.toLowerCase()}`}>
                    {report.severity}
                  </span>
                  <span className="date">
                    📅 {new Date(report.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="status">{report.status}</p>
              </div>
              <button
                className="download-btn"
                onClick={() => handleDownloadReport(report.reportId)}
              >
                📥 Download PDF
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>📄 No reports available yet</p>
          <p>Your completed appointments will generate reports here</p>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default ReportViewer;
