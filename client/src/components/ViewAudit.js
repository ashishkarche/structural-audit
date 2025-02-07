import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../static/ViewAudits.css";
import { FaEye, FaEdit, FaTrash, FaPlus } from "react-icons/fa";

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
      const response = await axios.get("https://structural-audit.vercel.app/api/audits/recent", config);
      setAudits(response.data);
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
      await axios.delete(`https://structural-audit.vercel.app/api/audits/${id}`, config);
      setAudits(audits.filter((audit) => audit.id !== id)); // Remove from UI
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
                <th>Status</th>
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
                    <td className={`status ${audit.status.toLowerCase()}`}>{audit.status}</td>
                    <td>
                      <button className="btn btn-info btn-sm me-2" onClick={() => navigate(`/audit/${audit.id}`)}>
                        <FaEye /> View
                      </button>
                      <button className="btn btn-warning btn-sm me-2" onClick={() => navigate(`/edit-audit/${audit.id}`)}>
                        <FaEdit /> Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(audit.id)}>
                        <FaTrash /> Delete
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
