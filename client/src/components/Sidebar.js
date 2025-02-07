// components/Sidebar.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "../static/Sidebar.css";
import { FaSignOutAlt, FaChartBar, FaFolderOpen, FaUserEdit, FaCog, FaClipboardList } from "react-icons/fa";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <h2 className="sidebar-logo">AuditPro</h2>
      <ul className="sidebar-nav">
        <li onClick={() => navigate("/dashboard")}><FaChartBar /> Dashboard</li>
        <li onClick={() => navigate("/view-audits")}><FaFolderOpen /> Audits</li>
        <li onClick={() => navigate("/edit-profile")}><FaUserEdit /> Profile</li>
        <li><FaClipboardList /> Reports</li>
        <li><FaCog /> Settings</li>
      </ul>
      <button onClick={handleLogout} className="sidebar-logout"><FaSignOutAlt /> Logout</button>
    </aside>
  );
}

export default Sidebar;
