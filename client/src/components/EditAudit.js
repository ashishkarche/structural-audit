import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../static/EditAudit.css";
import { FaSave, FaArrowLeft } from "react-icons/fa";

function EditAudit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auditData, setAuditData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchAuditDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`http://localhost:5000/api/audits/${id}`, config);
        setAuditData(response.data);
      } catch (err) {
        console.error("Error fetching audit:", err);
        setErrorMessage("Failed to load audit details.");
      }
    };
    fetchAuditDetails();
  }, [id]);

  const handleInputChange = (e) => {
    setAuditData({ ...auditData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };
      await axios.put(`http://localhost:5000/api/audits/${id}`, auditData, config);

      alert("Audit updated successfully!");
      navigate("/view-audits");
    } catch (err) {
      console.error("Error updating audit:", err);
      setErrorMessage("Failed to update audit. Please try again.");
    }
  };

  if (errorMessage) return <p className="error-message">{errorMessage}</p>;
  if (!auditData) return <p className="loading-message">Loading...</p>;

  return (
    <div className="audit-edit-container">
      <button className="audit-back-button" onClick={() => navigate(`/audit/${id}`)}>
        <FaArrowLeft /> Back to Audit Details
      </button>

      <h2 className="audit-edit-title">Edit Audit</h2>
      <form onSubmit={handleFormSubmit} className="audit-edit-form">
        <div className="audit-form-group">
          <label>Project Name</label>
          <input type="text" name="name" value={auditData.name} onChange={handleInputChange} required />
        </div>

        <div className="audit-form-group">
          <label>Location</label>
          <input type="text" name="location" value={auditData.location} onChange={handleInputChange} required />
        </div>

        <div className="audit-form-group">
          <label>Date of Audit</label>
          <input type="date" name="date_of_audit" value={auditData.date_of_audit} onChange={handleInputChange} required />
        </div>

        <div className="audit-form-group">
          <label>Structural Changes</label>
          <textarea name="structural_changes" value={auditData.structural_changes} onChange={handleInputChange}></textarea>
        </div>

        <div className="audit-form-group">
          <label>Status</label>
          <select name="status" value={auditData.status} onChange={handleInputChange} required>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button type="submit" className="audit-save-button">
          <FaSave /> Save Changes
        </button>
      </form>
    </div>
  );
}

export default EditAudit;
