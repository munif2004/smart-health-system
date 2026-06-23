import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SymptomChecker.css';
import { aiAPI } from '../utils/api';

const SymptomChecker = ({ onPredictionComplete }) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const commonSymptoms = [
    'Chest pain',
    'Headache',
    'Fever',
    'Breathing issue',
    'Back pain',
    'Joint pain',
    'Fatigue',
    'Nausea',
    'Dizziness',
    'Cough'
  ];

  const handleAddSymptom = (symptom) => {
    if (!symptoms.includes(symptom)) {
      setSymptoms(symptoms ? `${symptoms}, ${symptom}` : symptom);
    }
  };

  const handleRemoveSymptom = (symptom) => {
    const filtered = symptoms
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== symptom)
      .join(', ');
    setSymptoms(filtered);
  };

  const handleCheckSymptoms = () => {
    if (!symptoms.trim()) {
      toast.error('Please enter at least one symptom');
      return;
    }

    setLoading(true);
    const symptomList = symptoms.split(',').map(s => s.trim());

    aiAPI.checkSymptoms({ symptoms: symptomList })
      .then(response => {
        setPrediction(response.data.prediction);
        setShowResult(true);
        toast.success('✓ Symptom analysis completed');
        if (onPredictionComplete) {
          onPredictionComplete(response.data.prediction, symptomList);
        }
      })
      .catch(error => {
        console.error('Symptom Check Error:', error?.response?.data || error?.message);
        const errorMsg = error?.response?.data?.error || error?.message || 'Error analyzing symptoms. Please try again.';
        toast.error(`❌ ${errorMsg}`);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="symptom-checker">
      <div className="checker-header">
        <h2>🏥 Smart AI Symptom Checker</h2>
        <p>Describe your symptoms and get instant AI analysis</p>
      </div>

      <div className="checker-content">
        {/* Input Area */}
        <div className="input-area">
          <label>Your Symptoms:</label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="E.g., Chest pain, Shortness of breath..."
            rows="4"
            disabled={loading}
          />
        </div>

        {/* Quick Add Buttons */}
        <div className="quick-symptoms">
          <p>Or select common symptoms:</p>
          <div className="symptom-buttons">
            {commonSymptoms.map((symptom) => (
              <button
                key={symptom}
                className="symptom-btn"
                onClick={() => handleAddSymptom(symptom)}
                disabled={loading}
              >
                + {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Symptoms */}
        {symptoms && (
          <div className="selected-symptoms">
            <p>Selected Symptoms:</p>
            <div className="symptom-tags">
              {symptoms.split(',').map((symptom) => (
                <span key={symptom} className="symptom-tag">
                  {symptom.trim()}
                  <button onClick={() => handleRemoveSymptom(symptom.trim())}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Check Button */}
        <button
          className="check-btn"
          onClick={handleCheckSymptoms}
          disabled={loading || !symptoms.trim()}
        >
          {loading ? 'Analyzing...' : '🔍 Analyze Symptoms'}
        </button>

        {/* Prediction Result */}
        {showResult && prediction && (
          <div className={`prediction-result ${prediction.severity.toLowerCase()}`}>
            <h3>AI Analysis Results</h3>
            
            <div className="result-item">
              <strong>Predicted Condition:</strong>
              <span className="disease-name">{prediction.disease}</span>
            </div>

            <div className="result-item">
              <strong>Confidence Level:</strong>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill"
                  style={{ width: `${prediction.confidence}%` }}
                >
                  {prediction.confidence}%
                </div>
              </div>
            </div>

            <div className="result-item">
              <strong>Severity Level:</strong>
              <span className={`severity-badge ${prediction.severity.toLowerCase()}`}>
                {prediction.severity}
              </span>
            </div>

            <div className="result-item">
              <strong>Recommended Department:</strong>
              <span className="department">{prediction.recommendedDepartment}</span>
            </div>

            {prediction.isEmergency && (
              <div className="emergency-alert">
                🚨 EMERGENCY CASE - Immediate medical attention required!
              </div>
            )}

            <div className="suggested-actions">
              <strong>Suggested Actions:</strong>
              <ul>
                {prediction.suggestedActions.map((action, idx) => (
                  <li key={idx}>✓ {action}</li>
                ))}
              </ul>
            </div>

            <div className="result-footer">
              <p className="disclaimer">
                💡 This is an AI-assisted analysis for reference only. 
                Please consult with a healthcare professional for accurate diagnosis.
              </p>
            </div>
          </div>
        )}
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default SymptomChecker;
