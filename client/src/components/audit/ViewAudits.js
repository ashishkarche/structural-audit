import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/ViewAudits.css";
import { FaEye, FaEdit, FaTrash, FaPlus, FaHistory } from "react-icons/fa";
import AuditHistory from "../audit/AuditHistory";

function ViewAudits() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get("https://your-api/api/audits/recent", config);

      // Format the date_of_audit for each audit
      const formattedAudits = response.data.map((audit) => {
        let displayDate = "";
        if (audit.date_of_audit) {
          const dateObj = new Date(audit.date_of_audit);
          if (!isNaN(dateObj)) {
            // Convert to YYYY-MM-DD
            displayDate = dateObj.toISOString().split("T")[0];
          }
        }
        return { ...audit, date_of_audit: displayDate };
      });
      setAudits(formattedAudits);
    } catch (error) {
      console.error("Error fetching audits:", error);
      setError("Failed to fetch audits. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this audit?")) return;
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`https://your-api/api/audits/${id}`, config);
      setAudits((prev) => prev.filter((audit) => audit.id !== id));
    } catch (error) {
      console.error("Error deleting audit:", error);
      alert("Failed to delete audit.");
    }
  };

  return (
    <div className="container audit-table-container">
      <div className="audit-header">
        <h2>Previous Audits</h2>
        <button className="btn btn-primary add-audit-btn" onClick={() => navigate("/submit-audit")}>
          <FaPlus /> Add New Audit
        </button>
      </div>

      {loading ? (
        <p className="loading-message">Loading audits...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Location</th>
                <th>Date of Audit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {audits.length > 0 ? (
                audits.map((audit) => (
                  <tr key={audit.id}>
                    <td>{audit.name}</td>
                    <td>{audit.location}</td>
                    <td>{audit.date_of_audit}</td>
                    <td>
                      <button className="btn btn-info btn-sm me-2" onClick={() => navigate(`/audit/${audit.id}/full`)}>
                        <FaEye /> View
                      </button>
                      <button className="btn btn-warning btn-sm me-2" onClick={() => navigate(`/audit/${audit.id}/edit`)}>
                        <FaEdit /> Edit
                      </button>
                      <button className="btn btn-danger btn-sm me-2" onClick={() => handleDelete(audit.id)}>
                        <FaTrash /> Delete
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/audit/${audit.id}/history`)}>
                        <FaHistory /> History
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">No audits available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ViewAudits;
