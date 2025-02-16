import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/SubmitAudit.css";

function SubmitAudit() {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    yearOfConstruction: "",
    dateOfAudit: "",
    area: "",
    structureType: "",
    cementType: "",
    steelType: "",
    numberOfStories: "",
    designedUse: "",
    presentUse: "",
    changesInBuilding: "",
    distressYear: "",
    distressNature: "",
    architecturalDrawing: null,
    structuralDrawing: null,
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } };

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "dateOfAudit" && formData[key]) {
        const formattedDate = new Date(formData[key]).toISOString().split("T")[0];
        formDataToSend.append(key, formattedDate);
      } else if (key === "distressYear" && formData[key]) {
        const yearOnly = new Date(formData[key]).getFullYear();
        formDataToSend.append(key, yearOnly);
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await axios.post("https://structural-audit.vercel.app/submit-audit", formDataToSend, config);
      navigate(`/audit/${response.data.auditId}/structural-changes`);
    } catch (err) {
      setError("Failed to submit audit. Please try again.");
    }
  };

  return (
    <div className="submit-audit-container">
      <h2 className="form-title">Submit New Audit</h2>
      {error && <p className="text-danger text-center">{error}</p>}
      
      <form onSubmit={handleSubmit} className="audit-form">
        <div className="form-grid">
          {/* Text Fields */}
          {[
            { key: "name", label: "Project Name" },
            { key: "location", label: "Location" },
            { key: "yearOfConstruction", label: "Year of Construction", type: "number" },
            { key: "dateOfAudit", label: "Date of Audit", type: "date" },
            { key: "area", label: "Area of Building (sq.ft.)" },
            { key: "structureType", label: "Type of Structure" },
            { key: "cementType", label: "Type of Cement Used (OPC/PPC/SRC/Other)" },
            { key: "steelType", label: "Type of Steel Reinforcement (Mild Steel/Cold Twisted Steel/TMT/Other)" },
            { key: "numberOfStories", label: "Number of Stories", type: "number" },
            { key: "designedUse", label: "Designed Use" },
            { key: "presentUse", label: "Present Use" },
            { key: "changesInBuilding", label: "Any Other Changes in Building" },
            { key: "distressYear", label: "Year of First Distress Noticed", type: "number" },
            { key: "distressNature", label: "Nature of Distress Noticed" },
          ].map(({ key, label, type }) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input
                type={type || "text"}
                placeholder={`Enter ${label}`}
                value={formData[key]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                required
              />
            </div>
          ))}

          {/* File Upload Fields */}
          {[
            { key: "architecturalDrawing", label: "Architectural Drawing (PDF)" },
            { key: "structuralDrawing", label: "Structural Drawing (PDF)" },
          ].map(({ key, label }) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFormData({ ...formData, [key]: e.target.files[0] })}
              />
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="form-group submit-btn-container">
          <button type="submit" className="submit-btn">Save & Next</button>
        </div>
      </form>
    </div>
  );
}

export default SubmitAudit;
