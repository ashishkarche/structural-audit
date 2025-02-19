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

  // Determine Corrosion Probability based on Potential
  const determineCorrosionProbability = (potential) => {
    if (!potential) return "";
    if (potential > -200) return "Low (10%) - No immediate action needed";
    if (potential >= -350) return "Uncertain (50%) - Monitor & consider preventive measures";
    return "High (90%) - Immediate corrosion control required";
  };

  const corrosionProbability = determineCorrosionProbability(parseFloat(formData.halfCellPotential));

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

          <label>Corrosion Probability & Recommendation:</label>
          <input type="text" value={corrosionProbability} readOnly />
        </>
      )}
    </div>
  );
};

export default HalfCellPotentialTest;
