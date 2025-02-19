import React, { useState } from "react";

const CoreSamplingTest = ({ formData, setFormData }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    setShowFields(e.target.value === "yes");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Compute L/D Ratio
  const computeLD = () => {
    const length = parseFloat(formData.coreLength) || 0;
    const diameter = parseFloat(formData.coreDiameter) || 1;
    return (length / diameter).toFixed(2);
  };

  // Get Correction Factor based on L/D Ratio
  const getCorrectionFactor = (ldRatio) => {
    if (ldRatio >= 2) return 1; // No correction needed
    if (ldRatio >= 1.75) return 0.98;
    if (ldRatio >= 1.5) return 0.96;
    if (ldRatio >= 1.25) return 0.93;
    return 0.90; // For very short cores
  };

  // Compute Corrected Strength
  const computeCorrectedStrength = () => {
    const strength = parseFloat(formData.coreStrength) || 0;
    const ldRatio = computeLD();
    const correctionFactor = getCorrectionFactor(ldRatio);
    return (strength * correctionFactor).toFixed(2);
  };

  // Compute Density
  const computeDensity = () => {
    const weight = parseFloat(formData.coreWeight) || 0;
    const diameter = parseFloat(formData.coreDiameter) || 1;
    const length = parseFloat(formData.coreLength) || 1;
    const volume = Math.PI * Math.pow(diameter / 2000, 2) * (length / 1000); // Volume in m³
    return volume > 0 ? (weight / volume).toFixed(2) : "";
  };

  return (
    <div className="test-section">
      <h3>Core Sampling Test</h3>
      <label>Perform Test?</label>
      <input type="radio" name="coreSamplingTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="coreSamplingTest" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Core Diameter (mm):</label>
          <input type="number" name="coreDiameter" value={formData.coreDiameter || ""} onChange={handleChange} />

          <label>Core Length (mm):</label>
          <input type="number" name="coreLength" value={formData.coreLength || ""} onChange={handleChange} />

          <label>L/D Ratio:</label>
          <input type="number" value={computeLD()} readOnly />

          <label>Measured Compressive Strength (MPa):</label>
          <input type="number" name="coreStrength" value={formData.coreStrength || ""} onChange={handleChange} />

          <label>Corrected Strength (MPa):</label>
          <input type="number" value={computeCorrectedStrength()} readOnly />

          <label>Core Weight (kg):</label>
          <input type="number" name="coreWeight" value={formData.coreWeight || ""} onChange={handleChange} />

          <label>Density (kg/m³):</label>
          <input type="number" value={computeDensity()} readOnly />
        </>
      )}
    </div>
  );
};

export default CoreSamplingTest;
