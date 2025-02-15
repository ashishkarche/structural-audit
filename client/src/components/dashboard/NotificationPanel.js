import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../static/NotificationPanel.css";

function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

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

      // Update UI to remove the read notification
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
      setNotifications([]); // Clear all from UI
    } catch (err) {
      setError("Failed to clear notifications.");
    }
  };

  return (
    <div className="notification-panel">
      <h3>🔔 Notifications</h3>
      {error && <p className="error">{error}</p>}
      
      {notifications.length === 0 ? (
        <p>No new notifications.</p>
      ) : (
        <>
          <button className="clear-btn" onClick={clearAllNotifications}>Clear All</button>
          <ul>
            {notifications.map((notification) => (
              <li key={notification.id} className={`notification ${notification.type}`}>
                {notification.message}
                <button className="mark-read-btn" onClick={() => markAsRead(notification.id)}>✔ Mark Read</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default NotificationPanel;
