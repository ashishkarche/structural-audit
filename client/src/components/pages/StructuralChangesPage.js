import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/StructuralChangesPage.css";

function StructuralChangesPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dateOfChange: "",
    changeDetails: "",
    previousInvestigations: null,
    repairYear: "",
    repairType: "",
    repairEfficacy: "",
    repairCost: "",
  });
  const [error, setError] = useState("");

  // Handle changes for both text inputs and file inputs
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "file" ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    const config = { 
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "multipart/form-data" 
      } 
    };

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    try {
      await axios.post(`https://structural-audit.vercel.app/api/structural-changes/${auditId}`, formDataToSend, config);
      navigate(`/audit/${auditId}/observations`);
    } catch (err) {
      setError("Failed to submit structural changes.");
    }
  };

  return (
    <div className="structural-changes-page-container">
      <h2 className="structural-changes-page-title">Structural Changes</h2>
      {error && <p className="structural-changes-error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="structural-changes-form">
        <div className="form-group">
          <label htmlFor="dateOfChange">Date of Change</label>
          <input
            type="date"
            id="dateOfChange"
            name="dateOfChange"
            value={formData.dateOfChange}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="changeDetails">Change Details</label>
          <textarea
            id="changeDetails"
            name="changeDetails"
            value={formData.changeDetails}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="previousInvestigations">Previous Investigations (File Upload)</label>
          <input
            type="file"
            id="previousInvestigations"
            name="previousInvestigations"
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="repairYear">Repair Year</label>
          <input
            type="number"
            id="repairYear"
            name="repairYear"
            value={formData.repairYear}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="repairType">Repair Type</label>
          <input
            type="text"
            id="repairType"
            name="repairType"
            value={formData.repairType}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="repairEfficacy">Repair Efficacy</label>
          <textarea
            id="repairEfficacy"
            name="repairEfficacy"
            value={formData.repairEfficacy}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="repairCost">Repair Cost</label>
          <input
            type="number"
            id="repairCost"
            name="repairCost"
            value={formData.repairCost}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="structural-changes-submit-btn">Save & Next</button>
      </form>
    </div>
  );
}

export default StructuralChangesPage;
