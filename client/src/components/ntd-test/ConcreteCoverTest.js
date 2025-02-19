import React, { useState } from "react";

const ConcreteCoverTest = ({ formData, setFormData }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    setShowFields(e.target.value === "yes");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Compute Cover Deficiency
  const computeCoverDeficiency = () => {
    const requiredCover = parseFloat(formData.concreteCoverRequired) || 0;
    const measuredCover = parseFloat(formData.concreteCoverMeasured) || 0;
    return (requiredCover - measuredCover).toFixed(2);
  };

  // Determine Structural Risk based on Cover Deficiency
  const determineStructuralRisk = (deficiency) => {
    if (!deficiency) return "";
    if (deficiency > 10) return "High Risk - Immediate corrective action required.";
    if (deficiency >= 5) return "Moderate Risk - Apply protective coatings, monitor over time.";
    return "Low Risk - No immediate action needed.";
  };

  const coverDeficiency = computeCoverDeficiency();
  const structuralRisk = determineStructuralRisk(parseFloat(coverDeficiency));

  return (
    <div className="test-section">
      <h3>Concrete Cover Test</h3>
      <label>Perform Test?</label>
      <input type="radio" name="concreteCoverTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="concreteCoverTest" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Required Cover (mm):</label>
          <input type="number" name="concreteCoverRequired" value={formData.concreteCoverRequired || ""} onChange={handleChange} />

          <label>Measured Cover (mm):</label>
          <input type="number" name="concreteCoverMeasured" value={formData.concreteCoverMeasured || ""} onChange={handleChange} />

          <label>Cover Deficiency (mm):</label>
          <input type="number" value={coverDeficiency} readOnly />

          <label>Structural Risk & Recommendation:</label>
          <input type="text" value={structuralRisk} readOnly />
        </>
      )}
    </div>
  );
};

export default ConcreteCoverTest;
