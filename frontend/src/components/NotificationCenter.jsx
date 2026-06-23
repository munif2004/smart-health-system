import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import './NotificationCenter.css';
import { notificationAPI } from '../utils/api';

const NotificationCenter = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const loadNotifications = () => {
    Promise.all([
      notificationAPI.getNotifications(),
      notificationAPI.getUnreadCount()
    ])
      .then(([notifRes, countRes]) => {
        setNotifications(notifRes.data);
        setUnreadCount(countRes.data.unreadCount);
      })
      .catch(err => console.error('Error loading notifications:', err));
  };

  const handleMarkAsRead = (notificationId) => {
    notificationAPI.markAsRead(notificationId)
      .then(() => {
        setNotifications(notifications.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      })
      .catch(err => console.error('Error:', err));
  };

  const handleMarkAllAsRead = () => {
    setLoading(true);
    notificationAPI.markAllAsRead()
      .then(() => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('✓ All notifications marked as read');
      })
      .catch(err => console.error('Error:', err))
      .finally(() => setLoading(false));
  };

  const handleDeleteNotification = (notificationId) => {
    notificationAPI.deleteNotification(notificationId)
      .then(() => {
        setNotifications(notifications.filter(n => n._id !== notificationId));
        toast.success('✓ Notification deleted');
      })
      .catch(err => console.error('Error:', err));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment':
        return '📅';
      case 'emergency':
        return '🚨';
      case 'system':
        return 'ℹ️';
      case 'ai-result':
        return '🤖';
      default:
        return '📬';
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="notification-bell">
        <button
          className="bell-btn"
          onClick={() => setIsOpen(!isOpen)}
          title="Notifications"
        >
          🔔
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <div className="notification-panel">
          <div className="panel-header">
            <h3>🔔 Notifications</h3>
            <div className="header-actions">
              {unreadCount > 0 && (
                <button
                  className="mark-all-btn"
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                >
                  Mark all as read
                </button>
              )}
              <button
                className="close-btn"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                  onMouseEnter={() => !notification.isRead && handleMarkAsRead(notification._id)}
                >
                  <span className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteNotification(notification._id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>✓ No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} />
    </>
  );
};

export default NotificationCenter;
