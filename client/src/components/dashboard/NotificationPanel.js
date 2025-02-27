import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaBell, FaTimes, FaCheck } from "react-icons/fa";
import "../../static/NotificationPanel.css";

function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown Date";
  
    // Convert "YYYY-MM-DD HH:mm:ss" → "YYYY-MM-DDTHH:mm:ss"
    const fixedTimestamp = timestamp.replace(" ", "T"); 
  
    // Try creating a Date object
    const date = new Date(fixedTimestamp);
  
    // If invalid, return a fallback message
    if (isNaN(date.getTime())) return "Invalid Date";
  
    return date.toLocaleString(); // Convert to readable format
  };
  
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`https://structural-audit.vercel.app/api/notifications/${id}/read`, {}, config);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
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
      <button className="toggle-btn" onClick={() => setShowPanel(!showPanel)}>
        <FaBell />
        {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
      </button>

      {showPanel && (
        <div className="notification-panel" ref={panelRef}>
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
                    <div>
                      <p>{notification.message}</p>
                      <span className="timestamp">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    <button className="mark-read-btn" onClick={() => markAsRead(notification.id)}>
                      <FaCheck />
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
