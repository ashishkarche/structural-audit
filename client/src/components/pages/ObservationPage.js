import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/ObservationPage.css";
import DamageClassification from "../observations/DamageClassification";

function ObservationPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    unexpectedLoad: "",
    unapprovedChanges: "",
    additionalFloor: "",
    vegetationGrowth: "",
    leakage: "",
    cracksBeams: "",
    cracksColumns: "",
    cracksFlooring: "",
    floorSagging: "",
    bulgingWalls: "",
    windowProblems: "",
    heavingFloor: "",
    concreteTexture: "",
    algaeGrowth: "",
    damagePhotos: [],
    damageDescription: "",
    damageLocation: "",
    damageCause: "",
    damageClassification: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`https://structural-audit.vercel.app/api/observations/${auditId}`, config);
        if (response.data) {
          setFormData(response.data);
        }
      } catch (err) {
        setError("No Observation changes found for this audit.");
      }
    };

    fetchData();
  }, [auditId]);

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;
    if (type === "file") {
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
      const method = formData.id ? "put" : "post";
      await axios[method](`https://structural-audit.vercel.app/api/observations/${auditId}`, formDataToSend, config);
      navigate(`/audit/${auditId}/immediate-concern`);
    } catch (err) {
      setError("Failed to submit observations.");
    }
  };

  return (
    <div className="obs-page-container">
      <h2 className="obs-page-title">🔍 General Observations of Structure</h2>
      {error && <p className="obs-error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="obs-form">
        {/* 🔹 General Observations with Yes/No Radio Buttons */}
        {[ 
          { name: "unexpectedLoad", label: "Any unprecedented loading observed (e.g., wall on slab)" },
          { name: "unapprovedChanges", label: "Any changes done that are not as per the original plan" },
          { name: "additionalFloor", label: "Any wing or floor added that looks out of character" },
          { name: "vegetationGrowth", label: "Any vegetation growth from structure" },
          { name: "leakage", label: "Leakage/seepage due to ineffective drainage system" },
        ].map((item) => (
          <div className="obs-form-group obs-radio-group" key={item.name}>
            <label>{item.label}</label>
            <div className="obs-radio-options">
              <label>
                <input type="radio" name={item.name} value="Yes" checked={formData[item.name] === "Yes"} onChange={handleChange} /> Yes
              </label>
              <label>
                <input type="radio" name={item.name} value="No" checked={formData[item.name] === "No"} onChange={handleChange} /> No
              </label>
            </div>
          </div>
        ))}

        {/* 🔹 Types of Cracks & Structural Issues */}
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
          <div className="obs-form-group obs-radio-group" key={item.name}>
            <label>{item.label}</label>
            <div className="obs-radio-options">
              <label>
                <input type="radio" name={item.name} value="Yes" checked={formData[item.name] === "Yes"} onChange={handleChange} /> Yes
              </label>
              <label>
                <input type="radio" name={item.name} value="No" checked={formData[item.name] === "No"} onChange={handleChange} /> No
              </label>
            </div>
          </div>
        ))}

        {/* 🔹 Damage Assessment */}
        <h3>Damage Assessment</h3>
        <div className="obs-form-group">
          <label htmlFor="damagePhotos">Upload Damage Photos</label>
          <input type="file" id="damagePhotos" name="damagePhotos" accept="image/*" multiple onChange={handleChange} />
        </div>
        <div className="obs-form-group">
          <label htmlFor="damageDescription">Description</label>
          <textarea id="damageDescription" name="damageDescription" value={formData.damageDescription} onChange={handleChange} />
        </div>
        <div className="obs-form-group">
          <label htmlFor="damageLocation">Location of Damage</label>
          <input type="text" id="damageLocation" name="damageLocation" value={formData.damageLocation} onChange={handleChange} />
        </div>
        <div className="obs-form-group">
          <label htmlFor="damageCause">Cause of Damage</label>
          <input type="text" id="damageCause" name="damageCause" value={formData.damageCause} onChange={handleChange} />
        </div>

        {/* 🔹 Damage Classification */}
        <h3>Classification of Damage</h3>
        <DamageClassification
          classification={formData.damageClassification}
          setClassification={(value) => setFormData({ ...formData, damageClassification: value })}
        />

        <button type="submit" className="obs-submit-btn">✅ Save & Next</button>
      </form>
    </div>
  );
}

export default ObservationPage;
