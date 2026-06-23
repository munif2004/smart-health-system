import React from 'react';
import { useNavigate } from 'react-router-dom';

const ChatMessage = ({ message }) => {
const isUser = message.role === 'user';
const timestamp = message.timestamp ? new Date(message.timestamp) : new Date();
const navigate = useNavigate();

return (
<div className={`ai-chat-message ${isUser ? 'user' : 'assistant'}`}>
{!isUser && <span className="ai-chat-avatar">AI</span>}

  <div className="ai-chat-bubble">
    <p style={{ whiteSpace: 'pre-line' }}>
      {message.message}
    </p>

    {message.bookingLink && (
      <button
        className="btn btn-primary mt-2"
        onClick={() => navigate(message.bookingLink)}
      >
        📅 Book Appointment
      </button>
    )}

    <time>
      {timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })}
      {isUser ? ' · Sent' : ''}
    </time>
  </div>

  {isUser && <span className="ai-chat-avatar user">You</span>}
</div>


);
};

export default ChatMessage;
