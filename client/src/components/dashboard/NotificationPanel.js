import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaBell, FaTimes, FaCheck } from "react-icons/fa"; // Icons for UI
import "../../static/NotificationPanel.css";

function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [showPanel, setShowPanel] = useState(false); // Toggle state for mobile

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get("https://structural-audit.vercel.app/api/notifications", config);
      setNotifications(response.data);
    } catch (err) {
      setError("Failed to load notifications.");
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`https://structural-audit.vercel.app/api/notifications/${id}/read`, {}, config);

      setNotifications(notifications.filter((notif) => notif.id !== id));
    } catch (err) {
      setError("Failed to mark notification as read.");
    }
  };

  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete("https://structural-audit.vercel.app/api/notifications/clear", config);
      setNotifications([]);
    } catch (err) {
      setError("Failed to clear notifications.");
    }
  };

  return (
    <div className="notification-container">
      {/* 🔔 Bell Button for Mobile/Tablet */}
      <button className="toggle-btn" onClick={() => setShowPanel(!showPanel)}>
        <FaBell />
        {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
      </button>

      {/* Notification Panel (Toggles on click) */}
      {showPanel && (
        <div className="notification-panel">
          <div className="panel-header">
            <h3>🔔 Notifications</h3>
            <button className="close-btn" onClick={() => setShowPanel(false)}>
              <FaTimes />
            </button>
          </div>

          {error && <p className="error">{error}</p>}
          {notifications.length === 0 ? (
            <p className="empty-message">No new notifications.</p>
          ) : (
            <>
              <button className="clear-btn" onClick={clearAllNotifications}>Clear All</button>
              <ul className="notification-list">
                {notifications.map((notification) => (
                  <li key={notification.id} className={`notification-item ${notification.type}`}>
                    {notification.message}
                    <button className="mark-read-btn" onClick={() => markAsRead(notification.id)}>
                      <FaCheck /> Mark Read
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
