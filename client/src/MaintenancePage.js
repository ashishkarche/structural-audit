import React from "react";
import './static/maintenance.css';

const MaintenancePage = () => {
  return (
    <div className="maintenance-container">
      <h1>🚧 Site Under Maintenance 🚧</h1>
      <p>We’re currently updating the site to improve your experience.</p>
      <p>Please check back soon! ⏳</p>
      
      <div className="spinner"></div>

      <footer>Thank you for your patience! – The Team</footer>
    </div>
  );
};

export default MaintenancePage;
