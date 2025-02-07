import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../static/SubmitAudit.css";

function SubmitAudit() {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    yearOfConstruction: "",
    dateOfAudit: "",
    area: "",
    use: "",
    structuralChanges: "",
    distressYear: "",
    distressNature: "",
    previousReports: "",
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
        const formattedDate = new Date(formData[key]).toISOString().split("T")[0]; // Convert full date to YYYY-MM-DD
        formDataToSend.append(key, formattedDate);
      } else if (key === "distressYear" && formData[key]) {
        const yearOnly = new Date(formData[key]).getFullYear(); // Extract only the year (YYYY)
        formDataToSend.append(key, yearOnly);
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });
  
    try {
      await axios.post("http://localhost:5000/submit-audit", formDataToSend, config);
      navigate("/dashboard");
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
          {Object.keys(formData).map((key) => (
            <div className="form-group" key={key}>
              <label>{key.replace(/([A-Z])/g, " $1").trim()}</label>
              {key.includes("Drawing") ? (
                <input
                  type="file"
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.files[0] })}
                />
              ) : (
                <input
                  type={key.includes("Year") || key.includes("date") ? "date" : "text"}
                  placeholder={`Enter ${key}`}
                  value={formData[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  required
                />
              )}
            </div>
          ))}
        </div>
        <div className="form-group submit-btn-container">
          <button type="submit" className="submit-btn">Submit Audit</button>
        </div>
      </form>
    </div>
  );
}

export default SubmitAudit;
