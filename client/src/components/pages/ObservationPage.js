import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/ObservationPage.css";
import DamageClassification from "../observations/DamageClassification";

function ObservationPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Section 1: General Observations
    unexpectedLoad: false,
    unapprovedChanges: false,
    additionalFloor: false,
    vegetationGrowth: false,
    leakage: false,

    // Section 2: Cracks & Structural Issues
    cracksBeams: false,
    cracksColumns: false,
    cracksFlooring: false,
    floorSagging: false,
    bulgingWalls: false,
    windowProblems: false,
    heavingFloor: false,

    // Section 3: Concrete & Surface Issues
    concreteTexture: "",
    algaeGrowth: "",

    // Section 4: Damage Assessment
    damagePhotos: [],
    damageDescription: "",
    damageLocation: "",
    damageCause: "",

    // Section 5: Classification of Damage
    damageClassification: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (type === "file") {
      setFormData({ ...formData, [name]: files });
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
    Object.keys(formData).forEach((key) => {
      if (key === "damagePhotos") {
        for (let i = 0; i < formData[key].length; i++) {
          formDataToSend.append("damagePhotos", formData[key][i]);
        }
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      await axios.post(`https://structural-audit.vercel.app/api/observations/${auditId}`, formDataToSend, config);
      navigate(`/audit/${auditId}/immediate-concern`);
    } catch (err) {
      setError("Failed to submit observations.");
    }
  };

  return (
    <div className="observation-page-container">
      <h2 className="observation-page-title">🔍 General Observations of Structure</h2>
      {error && <p className="observation-error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="observation-form">
        
        {/* 🔹 Section 1: General Observations */}
        <h3>General Observations</h3>
        {[
          { name: "unexpectedLoad", label: "Any unprecedented loading observed (e.g., wall on slab)" },
          { name: "unapprovedChanges", label: "Any changes done that are not as per the original plan" },
          { name: "additionalFloor", label: "Any wing or floor added that looks out of character" },
          { name: "vegetationGrowth", label: "Any vegetation growth from structure" },
          { name: "leakage", label: "Leakage/seepage due to ineffective drainage system" },
        ].map((item) => (
          <div className="form-group checkbox-group" key={item.name}>
            <label>
              <input type="checkbox" name={item.name} checked={formData[item.name]} onChange={handleChange} />
              {item.label}
            </label>
          </div>
        ))}

        {/* 🔹 Section 2: Cracks & Structural Issues */}
        <h3>Cracks & Structural Issues</h3>
        {[
          { name: "cracksBeams", label: "Cracks in Beams" },
          { name: "cracksColumns", label: "Cracks in Columns" },
          { name: "cracksFlooring", label: "Cracks in Flooring" },
          { name: "floorSagging", label: "Floor Sagging" },
          { name: "bulgingWalls", label: "Bulging of Walls/Plaster" },
          { name: "windowProblems", label: "Operational Problems for Windows & Doors" },
          { name: "heavingFloor", label: "Heaving up of Floor" },
        ].map((item) => (
          <div className="form-group checkbox-group" key={item.name}>
            <label>
              <input type="checkbox" name={item.name} checked={formData[item.name]} onChange={handleChange} />
              {item.label}
            </label>
          </div>
        ))}

        {/* 🔹 Section 3: Concrete & Surface Issues */}
        <h3>Concrete & Surface Issues</h3>
        <div className="form-group">
          <label htmlFor="concreteTexture">Colour & Texture of Concrete Structure</label>
          <input type="text" id="concreteTexture" name="concreteTexture" value={formData.concreteTexture} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="algaeGrowth">Algae Fungus Growth and/or Efflorescence</label>
          <input type="text" id="algaeGrowth" name="algaeGrowth" value={formData.algaeGrowth} onChange={handleChange} />
        </div>

        {/* 🔹 Section 4: Damage Assessment */}
        <h3>Damage Assessment</h3>
        <div className="form-group">
          <label htmlFor="damagePhotos">Upload Damage Photos</label>
          <input type="file" id="damagePhotos" name="damagePhotos" accept="image/*" multiple onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="damageDescription">Description</label>
          <textarea id="damageDescription" name="damageDescription" value={formData.damageDescription} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="damageLocation">Location of Damage</label>
          <input type="text" id="damageLocation" name="damageLocation" value={formData.damageLocation} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="damageCause">Cause of Damage</label>
          <input type="text" id="damageCause" name="damageCause" value={formData.damageCause} onChange={handleChange} />
        </div>

        {/* 🔹 Section 5: Classification of Damage */}
        <h3>Classification of Damage</h3>
        <DamageClassification
          classification={formData.damageClassification}
          setClassification={(value) => setFormData({ ...formData, damageClassification: value })}
        />

        <button type="submit" className="observation-submit-btn">✅ Save & Next</button>
      </form>
    </div>
  );
}

export default ObservationPage;
