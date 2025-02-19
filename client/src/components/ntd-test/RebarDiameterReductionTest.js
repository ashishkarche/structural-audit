import React, { useState } from "react";

const RebarDiameterReductionTest = ({ formData, setFormData }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    setShowFields(e.target.value === "yes");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Compute Rebar Diameter Reduction Percentage
  const computeReductionPercentage = () => {
    const originalDiameter = parseFloat(formData.originalRebarDiameter) || 1;
    const measuredDiameter = parseFloat(formData.measuredRebarDiameter) || 0;
    return (((originalDiameter - measuredDiameter) / originalDiameter) * 100).toFixed(2);
  };

  // Determine Structural Impact based on Reduction Percentage
  const determineStructuralImpact = (reduction) => {
    if (!reduction) return "";
    if (reduction > 10) return "High Impact - Strengthening or reinforcement replacement required.";
    if (reduction >= 5) return "Moderate Impact - Apply anti-corrosion coatings, monitor regularly.";
    return "Low Impact - No immediate action needed.";
  };

  const reductionPercentage = computeReductionPercentage();
  const structuralImpact = determineStructuralImpact(parseFloat(reductionPercentage));

  return (
    <div className="test-section">
      <h3>Rebar Diameter Reduction Test</h3>
      <label>Perform Test?</label>
      <input type="radio" name="rebarDiameterTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="rebarDiameterTest" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Original Rebar Diameter (mm):</label>
          <input type="number" name="originalRebarDiameter" value={formData.originalRebarDiameter || ""} onChange={handleChange} />

          <label>Measured Rebar Diameter (mm):</label>
          <input type="number" name="measuredRebarDiameter" value={formData.measuredRebarDiameter || ""} onChange={handleChange} />

          <label>Diameter Reduction (%):</label>
          <input type="number" value={reductionPercentage} readOnly />

          <label>Structural Impact & Recommendation:</label>
          <input type="text" value={structuralImpact} readOnly />
        </>
      )}
    </div>
  );
};

export default RebarDiameterReductionTest;
