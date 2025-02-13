import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../static/Sidebar.css";
import {
  FaSignOutAlt,
  FaChartBar,
  FaFolderOpen,
  FaUserEdit,
  FaCog,
  FaClipboardList,
  FaBars,
  FaTimes,
} from "react-icons/fa";

function Sidebar() {
  const navigate = useNavigate();
  // For small devices, start with sidebar closed.
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <h2 className="sidebar-logo">AuditPro</h2>
        <ul className="sidebar-nav">
          <li onClick={() => { navigate("/dashboard"); setIsOpen(false); }}>
            <FaChartBar /> Dashboard
          </li>
          <li onClick={() => { navigate("/view-audits"); setIsOpen(false); }}>
            <FaFolderOpen /> Audits
          </li>
          <li onClick={() => { navigate("/edit-profile"); setIsOpen(false); }}>
            <FaUserEdit /> Profile
          </li>
          <li onClick={() => setIsOpen(false)}>
            <FaClipboardList /> Reports
          </li>
          <li onClick={() => setIsOpen(false)}>
            <FaCog /> Settings
          </li>
        </ul>
        <button onClick={() => { handleLogout(); setIsOpen(false); }} className="sidebar-logout">
          <FaSignOutAlt /> Logout
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
