import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../static/ObservationPage.css";

function ObservationPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    unexpectedLoad: false,
    unapprovedChanges: false,
    additionalFloor: false,
    vegetationGrowth: false,
    leakage: false,
    cracksBeams: false,
    cracksColumns: false,
    cracksFlooring: false,
    floorSagging: false,
    bulgingWalls: false,
    windowProblems: false,
    heavingFloor: false,
    concreteTexture: "",
    algaeGrowth: "",
    damagePhoto: null,
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } };

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => formDataToSend.append(key, formData[key]));

    try {
      await axios.post(`https://structural-audit.vercel.app/api/observations/${auditId}`, formDataToSend, config);
      navigate(`/audit/${auditId}/immediate-concern`);
    } catch (err) {
      setError("Failed to submit observations.");
    }
  };

  return (
    <div className="observation-page-container">
      <h2 className="observation-page-title">General Observations</h2>
      {error && <p className="observation-error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="observation-form">
        {/* Checkbox Inputs */}
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="unexpectedLoad"
              checked={formData.unexpectedLoad}
              onChange={handleChange}
            />
            Unexpected Load
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="unapprovedChanges"
              checked={formData.unapprovedChanges}
              onChange={handleChange}
            />
            Unapproved Changes
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="additionalFloor"
              checked={formData.additionalFloor}
              onChange={handleChange}
            />
            Additional Floor
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="vegetationGrowth"
              checked={formData.vegetationGrowth}
              onChange={handleChange}
            />
            Vegetation Growth
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="leakage"
              checked={formData.leakage}
              onChange={handleChange}
            />
            Leakage
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="cracksBeams"
              checked={formData.cracksBeams}
              onChange={handleChange}
            />
            Cracks in Beams
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="cracksColumns"
              checked={formData.cracksColumns}
              onChange={handleChange}
            />
            Cracks in Columns
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="cracksFlooring"
              checked={formData.cracksFlooring}
              onChange={handleChange}
            />
            Cracks in Flooring
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="floorSagging"
              checked={formData.floorSagging}
              onChange={handleChange}
            />
            Floor Sagging
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="bulgingWalls"
              checked={formData.bulgingWalls}
              onChange={handleChange}
            />
            Bulging Walls
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="windowProblems"
              checked={formData.windowProblems}
              onChange={handleChange}
            />
            Window Problems
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="heavingFloor"
              checked={formData.heavingFloor}
              onChange={handleChange}
            />
            Heaving Floor
          </label>
        </div>

        {/* Text Inputs */}
        <div className="form-group">
          <label htmlFor="concreteTexture">Concrete Texture</label>
          <input
            type="text"
            id="concreteTexture"
            name="concreteTexture"
            value={formData.concreteTexture}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="algaeGrowth">Algae Growth</label>
          <input
            type="text"
            id="algaeGrowth"
            name="algaeGrowth"
            value={formData.algaeGrowth}
            onChange={handleChange}
          />
        </div>

        {/* File Input */}
        <div className="form-group">
          <label htmlFor="damagePhoto">Upload Damage Photo</label>
          <input
            type="file"
            id="damagePhoto"
            name="damagePhoto"
            accept="image/*"
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="observation-submit-btn">Save & Next</button>
      </form>
    </div>
  );
}

export default ObservationPage;
