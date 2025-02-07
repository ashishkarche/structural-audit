import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../static/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [auditor, setAuditor] = useState({});
  const [audits, setAudits] = useState([]);
  const [stats, setStats] = useState({ totalAudits: 0, inProgress: 0, completed: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const auditorRes = await axios.get("http://localhost:5000/api/auditors/me", config);
        const statsRes = await axios.get("http://localhost:5000/api/audits/stats", config);
        const auditsRes = await axios.get("http://localhost:5000/api/audits/recent", config);

        setAuditor(auditorRes.data);
        setStats(statsRes.data);
        setAudits(auditsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Welcome, {auditor.name}</h1>
          <p>{auditor.firm_name}</p>
        </header>

        <div className="dashboard-actions">
          <button onClick={() => navigate("/submit-audit")} className="btn-primary">+ Submit New Audit</button>
          <button onClick={() => navigate("/view-audits")} className="btn-secondary">View Previous Audits</button>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card"><h3>Total Audits</h3><p>{stats.totalAudits}</p></div>
          <div className="stat-card"><h3>In Progress</h3><p>{stats.inProgress}</p></div>
          <div className="stat-card"><h3>Completed</h3><p>{stats.completed}</p></div>
        </div>

        <div className="dashboard-table">
          <h2>Recent Audits</h2>
          <table>
            <thead>
              <tr><th>Project Name</th><th>Location</th><th>Audit Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {audits.map(audit => (
                <tr key={audit.id}>
                  <td>{audit.name}</td>
                  <td>{audit.location}</td>
                  <td>{audit.date_of_audit}</td>
                  <td className={`status ${audit.status.toLowerCase()}`}>{audit.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
