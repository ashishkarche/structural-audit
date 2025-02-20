import React, { useState } from "react";

const HalfCellPotentialTest = ({ formData, setFormData }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    setShowFields(e.target.value === "yes");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Determine Corrosion Probability based on Half-Cell Potential (As per IS 15926:2018)
  const determineCorrosionProbability = (potential) => {
    if (!potential) return "";
    if (potential > -200) return "Low Risk (10%)";
    if (potential >= -350) return "Moderate Risk (50%)";
    return "High Risk (90%)";
  };

  // Generate Recommendations based on Corrosion Risk
  const generateRecommendation = (potential) => {
    if (!potential) return "";

    if (potential > -200) {
      return "✅ Low Risk: Immediate repairs such as rebar treatment and patch repairsApply corrosion inhibitors as per IS 9077.Use cathodic protection.Apply anti-corrosion coatings for reinforcement. Ensure proper waterproofing to prevent moisture ingress.";
    }
    if (potential >= -350) {
      return "⚠️ Moderate Risk: Conduct frequent inspections (every 6-12 months). Apply protective coatings (epoxy/polyurethane) and consider corrosion-resistant rebars.";
    }
    return "❌ High Risk: No immediate action required but continue routine monitoring. Maintain the structure through periodic inspections and minor surface protection measures.";
  };

  const halfCellPotential = parseFloat(formData.halfCellPotential);
  const corrosionProbability = determineCorrosionProbability(halfCellPotential);
  const recommendation = generateRecommendation(halfCellPotential);

  return (
    <div className="test-section">
      <h3>Half-Cell Potential Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="halfCellPotentialTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="halfCellPotentialTest" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Potential (mV):</label>
          <input type="number" name="halfCellPotential" value={formData.halfCellPotential || ""} onChange={handleChange} />

          <label>Corrosion Probability:</label>
          <input type="text" value={corrosionProbability} readOnly />

          {/* ✅ Recommendation Box */}
          {recommendation && (
            <div className="recommendation-box">
              <h4>Recommendation (As per IS 15926:2018 & IS 9077):</h4>
              <p>{recommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HalfCellPotentialTest;
