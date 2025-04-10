import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import "../../static/AuditHistory.css";

const AuditHistory = () => {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(
          `https://your-api/api/audits/${auditId}/history`,
          config
        );
        setHistory(response.data);
      } catch (err) {
        setError("Failed to fetch audit history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [auditId]);

  return (
    <div className="audit-history-container">
      <button className="back-button" onClick={() => navigate(`/view-audits`)}>
        <FaArrowLeft /> Back
      </button>
      <h2>Audit History</h2>
      {loading ? (
        <p>Loading history...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Auditor</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.action}</td>
                <td>{entry.auditor_name || "Unknown"}</td>
                <td>{new Date(entry.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AuditHistory;
