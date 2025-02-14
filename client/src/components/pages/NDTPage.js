import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/NDTPage.css";

function NDTPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    reboundHammerTest: "",
    ultrasonicTest: "",
    coreSamplingTest: "",
    carbonationTest: "",
    chlorideTest: "",
    sulfateTest: "",
    halfCellPotentialTest: "",
    concreteCoverMeasurement: "",
    rebarDiameterReduction: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    try {
      await axios.post(`https://structural-audit.vercel.app/api/ndt/${auditId}`, formData, config);
      navigate(`/audit/${auditId}/details`);
    } catch (err) {
      setError("Failed to submit NDT results.");
    }
  };

  return (
    <div className="ndt-page-container">
      <h2 className="ndt-page-title">Non-Destructive Testing (NDT) Records</h2>
      {error && <p className="ndt-error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="ndt-form">
        <div className="form-group">
          <label htmlFor="reboundHammerTest">Rebound Hammer Test</label>
          <input
            type="text"
            id="reboundHammerTest"
            name="reboundHammerTest"
            value={formData.reboundHammerTest}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="ultrasonicTest">Ultrasonic Test</label>
          <input
            type="text"
            id="ultrasonicTest"
            name="ultrasonicTest"
            value={formData.ultrasonicTest}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="coreSamplingTest">Core Sampling Test</label>
          <input
            type="text"
            id="coreSamplingTest"
            name="coreSamplingTest"
            value={formData.coreSamplingTest}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="carbonationTest">Carbonation Test</label>
          <input
            type="text"
            id="carbonationTest"
            name="carbonationTest"
            value={formData.carbonationTest}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="chlorideTest">Chloride Test</label>
          <input
            type="text"
            id="chlorideTest"
            name="chlorideTest"
            value={formData.chlorideTest}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="sulfateTest">Sulfate Test</label>
          <input
            type="text"
            id="sulfateTest"
            name="sulfateTest"
            value={formData.sulfateTest}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="halfCellPotentialTest">Half-Cell Potential Test</label>
          <input
            type="text"
            id="halfCellPotentialTest"
            name="halfCellPotentialTest"
            value={formData.halfCellPotentialTest}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="concreteCoverMeasurement">Concrete Cover Measurement</label>
          <input
            type="text"
            id="concreteCoverMeasurement"
            name="concreteCoverMeasurement"
            value={formData.concreteCoverMeasurement}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="rebarDiameterReduction">Rebar Diameter Reduction</label>
          <input
            type="text"
            id="rebarDiameterReduction"
            name="rebarDiameterReduction"
            value={formData.rebarDiameterReduction}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="ndt-submit-btn">
          Save & Finish
        </button>
      </form>
    </div>
  );
}

export default NDTPage;
