import React, { useState } from 'react';
import './VoiceInput.css';

const VoiceInput = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);

  React.useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + transcriptSegment);
          } else {
            interimTranscript += transcriptSegment;
          }
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleStartListening = () => {
    if (recognition) {
      setTranscript('');
      recognition.start();
    }
  };

  const handleStopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const handleSendTranscript = () => {
    if (transcript.trim()) {
      onTranscript(transcript);
      setTranscript('');
    }
  };

  return (
    <div className="voice-input">
      <div className="voice-display">
        {isListening && <div className="listening-indicator">🎤 Listening...</div>}
        <p>{transcript || 'Click the microphone to start speaking...'}</p>
      </div>

      <div className="voice-controls">
        <button
          className={`voice-btn ${isListening ? 'active' : ''}`}
          onClick={isListening ? handleStopListening : handleStartListening}
        >
          🎤 {isListening ? 'Stop' : 'Start'}
        </button>

        {transcript && (
          <>
            <button className="send-btn" onClick={handleSendTranscript}>
              📤 Send
            </button>
            <button className="clear-btn" onClick={() => setTranscript('')}>
              🗑️ Clear
            </button>
          </>
        )}
      </div>

      {!recognition && (
        <p className="no-support">
          ⚠️ Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.
        </p>
      )}
    </div>
  );
};

export default VoiceInput;
