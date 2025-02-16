import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/ConclusionPage.css";

const ConclusionPage = () => {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    conclusion: "",
    recommendations: "",
    technicalComments: "",
    executiveEngineers: "",
    superintendingEngineers: "",
    chiefEngineers: "",
  });

  const [error, setError] = useState("");

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    const config = {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    };

    try {
      await axios.post(`https://structural-audit.vercel.app/api/conclusion/${auditId}`, formData, config);
      navigate(`/audit/${auditId}/details`); // ✅ Navigate to Audit Details after submission
    } catch (err) {
      setError("Failed to submit conclusions & recommendations.");
    }
  };

  return (
    <div className="conclusion-page-container">
      <h2 className="conclusion-page-title">Conclusion & Recommendations</h2>
      {error && <p className="conclusion-error-message">{error}</p>}
      
      <form onSubmit={handleSubmit} className="conclusion-form">
        {/* Conclusion */}
        <div className="form-group">
          <label htmlFor="conclusion">Conclusion of Audit</label>
          <textarea
            id="conclusion"
            name="conclusion"
            value={formData.conclusion}
            onChange={handleChange}
            required
          />
        </div>

        {/* Recommendations */}
        <div className="form-group">
          <label htmlFor="recommendations">Recommendations</label>
          <textarea
            id="recommendations"
            name="recommendations"
            value={formData.recommendations}
            onChange={handleChange}
            required
          />
        </div>

        {/* Technical Comments on Distress */}
        <div className="form-group">
          <label htmlFor="technicalComments">Technical Comments on Nature of Distress</label>
          <textarea
            id="technicalComments"
            name="technicalComments"
            value={formData.technicalComments}
            onChange={handleChange}
            required
          />
        </div>

        {/* Engineer Comments */}
        <div className="form-group">
          <label htmlFor="executiveEngineers">Executive Engineers</label>
          <input
            type="text"
            id="executiveEngineers"
            name="executiveEngineers"
            value={formData.executiveEngineers}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="superintendingEngineers">Superintending Engineers</label>
          <input
            type="text"
            id="superintendingEngineers"
            name="superintendingEngineers"
            value={formData.superintendingEngineers}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="chiefEngineers">Chief Engineers</label>
          <input
            type="text"
            id="chiefEngineers"
            name="chiefEngineers"
            value={formData.chiefEngineers}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="conclusion-submit-btn">Save & Finish</button>
      </form>
    </div>
  );
};

export default ConclusionPage;
