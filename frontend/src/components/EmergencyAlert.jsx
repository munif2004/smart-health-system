import React, { useState, useEffect } from 'react';
import './EmergencyAlert.css';

const EmergencyAlert = ({ severity, isEmergency, disease }) => {
  const [visible, setVisible] = useState(isEmergency);

  useEffect(() => {
    setVisible(isEmergency);
  }, [isEmergency]);

  if (!visible) return null;

  return (
    <div className="emergency-alert-container">
      <div className={`alert alert-${severity?.toLowerCase() || 'critical'}`}>
        <div className="alert-icon">🚨</div>
        <div className="alert-content">
          <h2>EMERGENCY ALERT</h2>
          <p className="condition">
            {disease || 'Critical Medical Condition Detected'}
          </p>
          <p className="instructions">
            <strong>Immediate Action Required:</strong>
          </p>
          <ul className="action-list">
            <li>🚑 Call emergency services immediately</li>
            <li>📍 Go to the nearest hospital emergency room</li>
            <li>⚠️ Do not delay - seek immediate medical attention</li>
            <li>📞 Contact emergency hotline: 911</li>
          </ul>
        </div>
        <button
          className="alert-close"
          onClick={() => setVisible(false)}
          aria-label="Close alert"
        >
          ✕
        </button>
      </div>

      {/* Floating RED banner */}
      <div className="emergency-banner">
        <div className="banner-pulse"></div>
        <span>⚠️ EMERGENCY - SEEK IMMEDIATE MEDICAL HELP</span>
      </div>
    </div>
  );
};

export default EmergencyAlert;
