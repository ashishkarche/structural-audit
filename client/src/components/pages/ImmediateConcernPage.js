import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../static/ImmediateConcern.css";

function ImmediateConcernPage() {
  // Retrieve the auditId from the URL
  const { auditId } = useParams();
  const [formData, setFormData] = useState({
    concernDescription: "",
    location: "",
    effectDescription: "",
    recommendedMeasures: "",
    damagePhoto: null,
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Handle both text and file inputs
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    const token = localStorage.getItem("token");
    const config = { 
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } 
    };
  
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => formDataToSend.append(key, formData[key]));
  
    try {
      await axios.post(`https://structural-audit.vercel.app/api/immediate-concern/${auditId}`, formDataToSend, config);
      navigate(`/audit/${auditId}/ndt-tests`);
    } catch (err) {
      console.error(err);
      setError("Failed to submit immediate concern.");
    }
  };
  
  return (
    <div className="immediate-concern-container">
      <h2>Immediate Concerns</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="form">
        <label>Concern Description</label>
        <textarea
          name="concernDescription"
          value={formData.concernDescription}
          onChange={handleChange}
          required
        />

        <label>Location</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
        />

        <label>Effect Description</label>
        <textarea
          name="effectDescription"
          value={formData.effectDescription}
          onChange={handleChange}
          required
        />

        <label>Recommended Measures</label>
        <textarea
          name="recommendedMeasures"
          value={formData.recommendedMeasures}
          onChange={handleChange}
          required
        />

        <label>Upload Damage Photo</label>
        <input
          type="file"
          name="damagePhoto"
          accept="image/*"
          onChange={handleChange}
        />
        <button type="submit">Save & Next</button>
      </form>
    </div>
  );
}

export default ImmediateConcernPage;
