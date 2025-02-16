import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/Dashboard.css";
import NotificationPanel from "../dashboard/NotificationPanel";

function Dashboard() {
  const navigate = useNavigate();
  const [auditor, setAuditor] = useState({});
  const [audits, setAudits] = useState([]);
  const [totalAudits, setTotalAudits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Unauthorized access. Please log in.");
          navigate("/");
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [auditorRes, totalAuditsRes, auditsRes] = await Promise.all([
          axios.get("https://structural-audit.vercel.app/api/auditors/me", config),
          axios.get("https://structural-audit.vercel.app/api/audits/total", config),
          axios.get("https://structural-audit.vercel.app/api/audits/recent", config),
        ]);

        setAuditor(auditorRes.data);
        setTotalAudits(totalAuditsRes.data.totalAudits);
        setAudits(auditsRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Welcome, {auditor.name || "Auditor"}</h1>
          <p>{auditor.firm_name || "Your Firm"}</p>
        </header>

        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <>
            <NotificationPanel />

            {/* Dashboard Quick Actions */}
            <div className="dashboard-actions">
              <button onClick={() => navigate("/submit-audit")} className="btn-primary">
                + Submit New Audit
              </button>
              <button onClick={() => navigate("/view-audits")} className="btn-secondary">
                View Previous Audits
              </button>
            </div>

            {/* Audit Statistics */}
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>Total Audits</h3>
                <p>{totalAudits}</p>
              </div>
            </div>

            {/* Recent Audits Table */}
            <div className="dashboard-table">
              <h2>Recent Audits</h2>
              {audits.length === 0 ? (
                <p>No recent audits available.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Location</th>
                      <th>Audit Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map((audit) => (
                      <tr key={audit.id}>
                        <td>{audit.name}</td>
                        <td>{audit.location}</td>
                        <td>{audit.date_of_audit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
