import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/EditAudit.css";
import { FaSave, FaArrowLeft } from "react-icons/fa";

function EditAudit() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [auditData, setAuditData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchAuditDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`https://your-api/api/audits/${auditId}`, config);

        // Convert date_of_audit to yyyy-MM-dd format
        const formattedAudit = {
          ...response.data,
          date_of_audit: response.data.date_of_audit
            ? response.data.date_of_audit.split("T")[0]  // Extract YYYY-MM-DD part
            : "",  
        };

        setAuditData(formattedAudit);
      } catch (err) {
        console.error("Error fetching audit:", err);
        setErrorMessage("Failed to load audit details.");
      }
    };
    fetchAuditDetails();
  }, [auditId]);

  const handleInputChange = (e) => {
    setAuditData({ ...auditData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };
      await axios.put(`https://your-api/api/audits/${auditId}`, auditData, config);
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
      <button className="audit-back-button" onClick={() => navigate(`/audit/${auditId}/full`)}>
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
          <label>Year of Construction</label>
          <input type="number" name="yearOfConstruction" value={auditData.year_of_construction} onChange={handleInputChange} />
        </div>

        <div className="audit-form-group">
          <label>Date of Audit</label>
          <input type="date" name="date_of_audit" value={auditData.date_of_audit} onChange={handleInputChange} required />
        </div>

        <div className="audit-form-group">
          <label>Building Area</label>
          <input type="text" name="area" value={auditData.area} onChange={handleInputChange} />
        </div>

        <div className="audit-form-group">
          <label>Structure Type</label>
          <input type="text" name="structureType" value={auditData.structure_type} onChange={handleInputChange} />
        </div>

        <div className="audit-form-group">
          <label>Cement Type</label>
          <input type="text" name="cementType" value={auditData.cement_type} onChange={handleInputChange} />
        </div>

        <div className="audit-form-group">
          <label>Steel Type</label>
          <input type="text" name="steelType" value={auditData.steel_type} onChange={handleInputChange} />
        </div>

        <div className="audit-form-group">
          <label>Number of Stories</label>
          <input type="number" name="numberOfStories" value={auditData.number_of_stories} onChange={handleInputChange} />
        </div>

        <div className="audit-form-group">
          <label>Designed Use</label>
          <input type="text" name="designedUse" value={auditData.designed_use} onChange={handleInputChange} />
        </div>

        <div className="audit-form-group">
          <label>Present Use</label>
          <input type="text" name="presentUse" value={auditData.present_use} onChange={handleInputChange} />
        </div>

        <div className="audit-form-group">
          <label>Changes in Building</label>
          <textarea name="changesInBuilding" value={auditData.changes_in_building} onChange={handleInputChange}></textarea>
        </div>

        <div className="audit-form-group">
          <label>Distress Year</label>
          <input type="number" name="distressYear" value={auditData.distress_year} onChange={handleInputChange} />
        </div>

        <div className="audit-form-group">
          <label>Distress Nature</label>
          <input type="text" name="distressNature" value={auditData.distress_nature} onChange={handleInputChange} />
        </div>

        <button type="submit" className="audit-save-button">
          <FaSave /> Save Changes
        </button>
      </form>
    </div>
  );
}

export default EditAudit;
