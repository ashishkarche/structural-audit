import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/NDTPage.css";

function NDTPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    reboundHammerTest: "",
    reboundGrading: "",
    ultrasonicTest: "",
    ultrasonicGrading: "",
    coreSamplingTest: "",
    carbonationTest: "",
    chlorideTest: "",
    sulfateTest: "",
    halfCellPotentialTest: "",
    concreteCoverRequired: "",
    concreteCoverMeasured: "",
    rebarDiameterReduction: "",
    crushingStrength: "",
    ndtPhoto: null,
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    };

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => formDataToSend.append(key, formData[key]));

    try {
      await axios.post(`https://structural-audit.vercel.app/api/ndt/${auditId}`, formDataToSend, config);
      navigate(`/audit/${auditId}/conclusion`);
    } catch (err) {
      setError("Failed to submit NDT results.");
    }
  };

  return (
    <div className="ndt-page-container">
      <h2 className="ndt-page-title">Non-Destructive Testing (NDT) Records</h2>
      {error && <p className="ndt-error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="ndt-form">
        {/* Rebound Hammer Test */}
        <div className="form-group">
          <label htmlFor="reboundHammerTest">Rebound Hammer Test</label>
          <input type="text" id="reboundHammerTest" name="reboundHammerTest" value={formData.reboundHammerTest} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="reboundGrading">Rebound Hammer Grading</label>
          <select id="reboundGrading" name="reboundGrading" value={formData.reboundGrading} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

        {/* Ultrasonic Test */}
        <div className="form-group">
          <label htmlFor="ultrasonicTest">Ultrasonic Test</label>
          <input type="text" id="ultrasonicTest" name="ultrasonicTest" value={formData.ultrasonicTest} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="ultrasonicGrading">Ultrasonic Test Grading</label>
          <select id="ultrasonicGrading" name="ultrasonicGrading" value={formData.ultrasonicGrading} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Good">Good</option>
            <option value="Moderate">Moderate</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

        {/* Core Sampling Test */}
        <div className="form-group">
          <label htmlFor="coreSamplingTest">Core Sampling Test</label>
          <input type="text" id="coreSamplingTest" name="coreSamplingTest" value={formData.coreSamplingTest} onChange={handleChange} required />
        </div>

        {/* Chemical Tests */}
        <div className="form-group">
          <label htmlFor="carbonationTest">Carbonation Test</label>
          <input type="text" id="carbonationTest" name="carbonationTest" value={formData.carbonationTest} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="chlorideTest">Chloride Test</label>
          <input type="text" id="chlorideTest" name="chlorideTest" value={formData.chlorideTest} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="sulfateTest">Sulfate Test</label>
          <input type="text" id="sulfateTest" name="sulfateTest" value={formData.sulfateTest} onChange={handleChange} required />
        </div>

        {/* Half-Cell Potential Test */}
        <div className="form-group">
          <label htmlFor="halfCellPotentialTest">Half-Cell Potential Test</label>
          <input type="text" id="halfCellPotentialTest" name="halfCellPotentialTest" value={formData.halfCellPotentialTest} onChange={handleChange} required />
        </div>

        {/* Concrete Cover Measurements */}
        <div className="form-group">
          <label htmlFor="concreteCoverRequired">Concrete Cover Required</label>
          <input type="text" id="concreteCoverRequired" name="concreteCoverRequired" value={formData.concreteCoverRequired} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="concreteCoverMeasured">Concrete Cover Measured</label>
          <input type="text" id="concreteCoverMeasured" name="concreteCoverMeasured" value={formData.concreteCoverMeasured} onChange={handleChange} required />
        </div>

        {/* Rebar Diameter Reduction */}
        <div className="form-group">
          <label htmlFor="rebarDiameterReduction">Rebar Diameter Reduction</label>
          <input type="text" id="rebarDiameterReduction" name="rebarDiameterReduction" value={formData.rebarDiameterReduction} onChange={handleChange} required />
        </div>

        {/* Crushing Strength */}
        <div className="form-group">
          <label htmlFor="crushingStrength">Crushing Strength</label>
          <input type="text" id="crushingStrength" name="crushingStrength" value={formData.crushingStrength} onChange={handleChange} required />
        </div>

        {/* NDT Photo Upload */}
        <div className="form-group">
          <label htmlFor="ndtPhoto">Upload Test Photo</label>
          <input type="file" id="ndtPhoto" name="ndtPhoto" accept="image/*" onChange={handleChange} />
        </div>

        <button type="submit" className="ndt-submit-btn">Save & Finish</button>
      </form>
    </div>
  );
}

export default NDTPage;
