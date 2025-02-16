import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/StructuralChangesPage.css";

function StructuralChangesPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    briefBackgroundHistory: "",
    dateOfChange: "",
    changeDetails: "",
    previousInvestigations: null,
    repairYear: "",
    repairType: "",
    repairEfficacy: "",
    repairCost: "",
    previousInvestigationReports: null,
    conclusionFromPreviousReport: "",
    scopeOfWork: "",
    purposeOfInvestigation: "",
  });
  const [error, setError] = useState("");

  // Handle changes for text inputs & file uploads
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
      <h2 className="structural-changes-page-title">
        BRIEF BACKGROUND HISTORY IF CHANGES IN BUILDING USE IS INVOLVED
      </h2>

      {error && <p className="structural-changes-error-message">{error}</p>}
      
      <form onSubmit={handleSubmit} className="structural-changes-form">
        <div className="form-group">
          <label htmlFor="briefBackgroundHistory">Brief Background History</label>
          <textarea
            id="briefBackgroundHistory"
            name="briefBackgroundHistory"
            value={formData.briefBackgroundHistory}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="dateOfChange">Date of Previous Structural Changes</label>
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
          <label htmlFor="changeDetails">Structural Changes Made in the Past</label>
          <textarea
            id="changeDetails"
            name="changeDetails"
            value={formData.changeDetails}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="previousInvestigations">Previous Investigations (Upload PDF)</label>
          <input
            type="file"
            id="previousInvestigations"
            name="previousInvestigations"
            accept="application/pdf"
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="repairYear">Year of Carrying Out Repairs</label>
          <input
            type="date"
            id="repairYear"
            name="repairYear"
            value={formData.repairYear}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="repairType">Type of Repairs</label>
          <input
            type="text"
            id="repairType"
            name="repairType"
            value={formData.repairType}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="repairEfficacy">Efficacy of Repairs</label>
          <textarea
            id="repairEfficacy"
            name="repairEfficacy"
            value={formData.repairEfficacy}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="repairCost">Cost of Repairs</label>
          <input
            type="text"
            id="repairCost"
            name="repairCost"
            value={formData.repairCost}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="previousInvestigationReports">Reports of Previous Investigations (Upload PDFs)</label>
          <input
            type="file"
            id="previousInvestigationReports"
            name="previousInvestigationReports"
            accept="application/pdf"
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="conclusionFromPreviousReport">Conclusion from Previous Report</label>
          <textarea
            id="conclusionFromPreviousReport"
            name="conclusionFromPreviousReport"
            value={formData.conclusionFromPreviousReport}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="scopeOfWork">Scope of Work</label>
          <textarea
            id="scopeOfWork"
            name="scopeOfWork"
            value={formData.scopeOfWork}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="purposeOfInvestigation">Purpose of Investigation</label>
          <textarea
            id="purposeOfInvestigation"
            name="purposeOfInvestigation"
            value={formData.purposeOfInvestigation}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="structural-changes-submit-btn">
          Save & Next
        </button>
      </form>
    </div>
  );
}

export default StructuralChangesPage;
