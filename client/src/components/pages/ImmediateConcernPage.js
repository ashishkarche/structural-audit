import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../static/ImmediateConcern.css";

function ImmediateConcernPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();

  // ✅ Track if form is already submitted
  const [isSubmitted, setIsSubmitted] = useState(localStorage.getItem(`immediateConcern_${auditId}`) === "submitted");

  const [formData, setFormData] = useState({
    concernDescription: "",
    location: "",
    effectDescription: "",
    recommendedMeasures: "",
    damagePhoto: null,
  });

  const [damagePreview, setDamagePreview] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    if (isSubmitted) return;
    const { name, value, files } = e.target;

    if (files && files[0]) {
      // Convert image to preview URL
      const reader = new FileReader();
      reader.readAsDataURL(files[0]);
      reader.onloadend = () => {
        setDamagePreview(reader.result);
      };

      setFormData({
        ...formData,
        [name]: files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    const config = {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
    };

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => formDataToSend.append(key, formData[key]));

    try {
      await axios.post(`https://structural-audit.vercel.app/api/immediate-concern/${auditId}`, formDataToSend, config);

      // ✅ Mark form as submitted
      localStorage.setItem(`immediateConcern_${auditId}`, "submitted");
      setIsSubmitted(true);
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

      {isSubmitted ? (
        <p>Your data has already been submitted. You can view the details below.</p>
      ) : (
        <form onSubmit={handleSubmit} className="form">
          <label>Concern Description</label>
          <textarea
            name="concernDescription"
            value={formData.concernDescription}
            onChange={handleChange}
            required
            disabled={isSubmitted}
          />

          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            disabled={isSubmitted}
          />

          <label>Effect Description</label>
          <textarea
            name="effectDescription"
            value={formData.effectDescription}
            onChange={handleChange}
            required
            disabled={isSubmitted}
          />

          <label>Recommended Measures</label>
          <textarea
            name="recommendedMeasures"
            value={formData.recommendedMeasures}
            onChange={handleChange}
            required
            disabled={isSubmitted}
          />

          {/* 🔹 Upload & Preview Damage Photo */}
          <label>Upload Damage Photo</label>
          <input
            type="file"
            name="damagePhoto"
            accept="image/*"
            onChange={handleChange}
            disabled={isSubmitted}
          />

          {/* Show Damage Photo Preview */}
          {damagePreview && (
            <div className="image-preview-container">
              <h4>📷 Damage Photo Preview</h4>
              <img src={damagePreview} alt="Damage" width="250px" />
            </div>
          )}

          {!isSubmitted && <button type="submit">Save & Next</button>}
        </form>
      )}
    </div>
  );
}

export default ImmediateConcernPage;
