import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReboundHammerTest from "../ntd-test/ReboundHammerTest";
import UltrasonicTest from "../ntd-test/UltrasonicTest";
import CoreSamplingTest from "../ntd-test/CoreSamplingTest";
import CarbonationTest from "../ntd-test/CarbonationTest";
import ChlorideTest from "../ntd-test/ChlorideTest";
import SulfateTest from "../ntd-test/SulfateTest";
import HalfCellPotentialTest from "../ntd-test/HalfCellPotentialTest";
import ConcreteCoverTest from "../ntd-test/ConcreteCoverTest";
import RebarDiameterReductionTest from "../ntd-test/RebarDiameterReductionTest";
import CrushingStrengthTest from "../ntd-test/CrushingStrengthTest";
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
    concreteCoverTest: "",
    rebarDiameterTest: "",
    crushingStrengthTest: "",
    concreteCoverRequired: "",
    concreteCoverMeasured: "",
    rebarDiameterReduction: "",
    crushingStrength: "",
    ndtPhoto: null,
  });

  const [error, setError] = useState("");

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
        
        {/* Test Components */}
        <ReboundHammerTest formData={formData} setFormData={setFormData} />
        <UltrasonicTest formData={formData} setFormData={setFormData} />
        <CoreSamplingTest formData={formData} setFormData={setFormData} />
        <CarbonationTest formData={formData} setFormData={setFormData} />
        <ChlorideTest formData={formData} setFormData={setFormData} />
        <SulfateTest formData={formData} setFormData={setFormData} />
        <HalfCellPotentialTest formData={formData} setFormData={setFormData} />
        <ConcreteCoverTest formData={formData} setFormData={setFormData} />
        <RebarDiameterReductionTest formData={formData} setFormData={setFormData} />
        <CrushingStrengthTest formData={formData} setFormData={setFormData} />

        {/* NDT Photo Upload */}
        <div className="form-group">
          <label htmlFor="ndtPhoto">Upload Test Photo</label>
          <input type="file" id="ndtPhoto" name="ndtPhoto" accept="image/*" onChange={(e) => setFormData({ ...formData, ndtPhoto: e.target.files[0] })} />
        </div>

        <button type="submit" className="ndt-submit-btn">Save & Finish</button>
      </form>
    </div>
  );
}

export default NDTPage;
