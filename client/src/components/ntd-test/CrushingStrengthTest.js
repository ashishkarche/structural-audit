import React, { useState } from "react";

const CrushingStrengthTest = ({ formData, setFormData }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    setShowFields(e.target.value === "yes");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Determine Concrete Grade & Structural Performance
  const determineStrengthPerformance = (strength) => {
    if (!strength) return "";
    if (strength >= 40) return "High Strength - Excellent Performance. No action needed.";
    if (strength >= 30) return "Medium Strength - Good Performance. Minor surface treatments.";
    if (strength >= 20) return "Normal Strength - Acceptable. Monitor structure.";
    return "Low Strength - Weak. Immediate strengthening or replacement required.";
  };

  const strengthPerformance = determineStrengthPerformance(parseFloat(formData.crushingStrength));

  return (
    <div className="test-section">
      <h3>Crushing Strength Test</h3>
      <label>Perform Test?</label>
      <input type="radio" name="crushingStrengthTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="crushingStrengthTest" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Compressive Strength (MPa):</label>
          <input type="number" name="crushingStrength" step="0.1" value={formData.crushingStrength || ""} onChange={handleChange} />

          <label>Strength Classification & Recommendation:</label>
          <input type="text" value={strengthPerformance} readOnly />
        </>
      )}
    </div>
  );
};

export default CrushingStrengthTest;
