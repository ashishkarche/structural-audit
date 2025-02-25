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
    damages: [],
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

  const handleDamageChange = (index, e) => {
    const { name, value } = e.target;
    const updatedDamages = [...formData.damages];
    updatedDamages[index][name] = value;
    setFormData({ ...formData, damages: updatedDamages });
  };

  const handleDamageImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const updatedDamages = [...formData.damages];
        updatedDamages[index].photo = {
          preview: reader.result, // Base64 preview
          file,
        };
        setFormData({ ...formData, damages: updatedDamages });
      };
    }
  };
  

  const handleDamageClassificationChange = (index, value) => {
    const updatedDamages = [...formData.damages];
    updatedDamages[index].classification = value;
    setFormData({ ...formData, damages: updatedDamages });
  };
  const addDamage = () => {
    setFormData({
      ...formData,
      damages: [...formData.damages, { photo: null, description: "", location: "", cause: "", classification: "" }],
    });
  };
  const removeDamage = (index) => {
    const updatedDamages = [...formData.damages];
    updatedDamages.splice(index, 1);
    setFormData({ ...formData, damages: updatedDamages });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } };
  
    const formDataToSend = new FormData();
  
    // Append general observations
    Object.keys(formData).forEach((key) => {
      if (key !== "damages") {
        formDataToSend.append(key, formData[key]);
      }
    });
  
    // Append damages as JSON
    formDataToSend.append("damages", JSON.stringify(formData.damages));
  
    // Append images as BLOB
    formData.damages.forEach((damage, index) => {
      if (damage.photo?.file) {
        formDataToSend.append("damagePhotos", damage.photo.file);
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
        {/* 🔹 Damage Assessment (Supports Multiple Entries) */}
        <h3>Damage Assessment</h3>

        {formData.damages.map((damage, index) => (
          <div className="obs-damage-section" key={index}>
            <h4>Damage {index + 1}</h4>

            {/* 📷 Upload Damage Photo */}
            <div className="obs-form-group">
              <label>Upload Damage Photo</label>
              <input type="file" accept="image/*" onChange={(e) => handleDamageImageChange(index, e)} />
              {damage.photo?.preview && <img src={damage.photo.preview} alt="Damage" width="200px" />}
            </div>

            {/* 📝 Description */}
            <div className="obs-form-group">
              <label>Description</label>
              <textarea name="description" value={damage.description} onChange={(e) => handleDamageChange(index, e)} />
            </div>

            {/* 📍 Location */}
            <div className="obs-form-group">
              <label>Location</label>
              <input type="text" name="location" value={damage.location} onChange={(e) => handleDamageChange(index, e)} />
            </div>

            {/* ⚠️ Cause of Damage */}
            <div className="obs-form-group">
              <label>Cause</label>
              <input type="text" name="cause" value={damage.cause} onChange={(e) => handleDamageChange(index, e)} />
            </div>

            {/* 📊 Damage Classification */}
            <DamageClassification
              classification={damage.classification}
              setClassification={(value) => handleDamageClassificationChange(index, value)}
            />

            {/* ❌ Remove Damage Entry */}
            <button type="button" className="obs-remove-btn" onClick={() => removeDamage(index)}>🗑️ Remove</button>
          </div>
        ))}

        {/* ➕ Add New Damage Entry */}
        <button type="button" className="obs-add-btn" onClick={addDamage}>➕ Add Damage</button>

        <button type="submit" className="obs-submit-btn">✅ Save & Next</button>
      </form>
    </div>
  );
}

export default ObservationPage;
