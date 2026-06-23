import React, { useEffect, useRef, useState } from 'react';
import { FiSend, FiTrash2 } from 'react-icons/fi';
import { chatbotAPI } from '../utils/api';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import './AIChat.css';

const AIChat = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [quickButtons, setQuickButtons] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const [intro, history] = await Promise.all([
        chatbotAPI.getChatbot(),
        userId ? chatbotAPI.getChatHistory().catch(() => ({ data: { conversation: [] } })) : Promise.resolve({ data: { conversation: [] } })
      ]);

      setQuickButtons(intro.data.quickButtons || []);
      setMessages(history.data.conversation?.length ? history.data.conversation : [{
        role: 'assistant',
        message: intro.data.message,
        timestamp: new Date()
      }]);
    };

    load().catch(() => {});
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (messageText = input) => {
    const text = messageText.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', message: text, timestamp: new Date() };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatbotAPI.sendMessage({ message: text, userId });
     setMessages((current) => [...current, {
  role: 'assistant',
  message: response.data.message,
  bookingLink: response.data.bookingLink,
  department: response.data.department,
  doctor: response.data.doctor,
  timestamp: response.data.timestamp
}]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'assistant',
        message: error?.response?.data?.error || 'I could not process that right now. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    await chatbotAPI.clearChatHistory().catch(() => {});
    setMessages([]);
  };

  return (
    <div className="ai-chat">
      <div className="ai-chat-header">
        <div>
          <strong>AI Health Assistant</strong>
          <span>Symptom triage, department guidance, appointments, reminders</span>
        </div>
        <button type="button" onClick={clearHistory} title="Clear chat"><FiTrash2 /></button>
      </div>

      <div className="ai-chat-body">
        {messages.map((message, index) => <ChatMessage key={`${message.timestamp}-${index}`} message={message} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="ai-chat-quick">
        {quickButtons.map((button) => (
          <button type="button" key={button.id} onClick={() => sendMessage(button.label)}>
            {button.label}
          </button>
        ))}
      </div>

      <div className="ai-chat-input">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
          placeholder="Describe symptoms or ask for guidance..."
        />
        <button type="button" onClick={() => sendMessage()} disabled={loading || !input.trim()}><FiSend /></button>
      </div>
    </div>
  );
};

export default AIChat;
