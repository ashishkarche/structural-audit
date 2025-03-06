import React, { useState, useEffect } from "react";

const CoreSamplingTest = ({ formData, setFormData, handleImageChange, imageData, isSubmitted }) => {
  const [showFields, setShowFields] = useState(!!formData.core_sampling_test);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      core_sampling_test: value ? "yes" : "no",
      coreDiameter: value ? prev.coreDiameter || "" : "",
      coreLength: value ? prev.coreLength || "" : "",
      coreStrength: value ? prev.coreStrength || "" : "",
      coreWeight: value ? prev.coreWeight || "" : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const computeLD = () => {
    const length = parseFloat(formData.coreLength) || 0;
    const diameter = parseFloat(formData.coreDiameter) || 1;
    return (length / diameter).toFixed(2);
  };

  const getCorrectionFactor = (ldRatio) => {
    if (ldRatio >= 2) return 1;
    if (ldRatio >= 1.75) return 0.98;
    if (ldRatio >= 1.5) return 0.96;
    if (ldRatio >= 1.25) return 0.93;
    return 0.90;
  };

  const computeCorrectedStrength = () => {
    const strength = parseFloat(formData.coreStrength) || 0;
    return (strength * getCorrectionFactor(computeLD())).toFixed(2);
  };

  const computeDensity = () => {
    const weight = parseFloat(formData.coreWeight) || 0;
    const diameter = parseFloat(formData.coreDiameter) || 1;
    const length = parseFloat(formData.coreLength) || 1;
    const volume = Math.PI * Math.pow(diameter / 2000, 2) * (length / 1000);
    return volume > 0 ? (weight / volume).toFixed(2) : "";
  };

  const generateRecommendation = (correctedStrength) => {
    if (!correctedStrength) return "⚠️ No data available.";
    if (correctedStrength >= 85) return "The concrete meets the required strength criteria. No action required.";
    if (correctedStrength >= 75) return "Strength is slightly lower. Monitoring & minor surface repairs recommended.";
    if (correctedStrength >= 50) return "Strength is weak. Structural strengthening using jacketing, grouting advised.";
    return "Highly defective concrete. Immediate intervention, retrofitting, or replacement needed.";
  };

  const lD_Ratio = computeLD();
  const correctedStrength = computeCorrectedStrength();
  const density = computeDensity();
  const recommendation = generateRecommendation(parseFloat(correctedStrength));

  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        core_sampling_ld_ratio: lD_Ratio,
        core_sampling_corrected_strength: correctedStrength,
        core_sampling_density: density,
        core_sampling_recommendation: recommendation,
      }));
    }
  }, [lD_Ratio, correctedStrength, density, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Core Sampling Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="core_sampling_test" value="yes" checked={showFields} onChange={handleRadioChange} /> Yes
      <input type="radio" name="core_sampling_test" value="no" checked={!showFields} onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Core Diameter (mm):</label>
          <input type="number" name="coreDiameter" value={formData.coreDiameter || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Core Length (mm):</label>
          <input type="number" name="coreLength" value={formData.coreLength || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>L/D Ratio:</label>
          <input type="number" value={formData.core_sampling_ld_ratio || ""} readOnly />

          <label>Measured Compressive Strength (MPa):</label>
          <input type="number" name="coreStrength" value={formData.coreStrength || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Corrected Strength (MPa):</label>
          <input type="number" value={formData.core_sampling_corrected_strength || ""} readOnly />

          <label>Core Weight (kg):</label>
          <input type="number" name="coreWeight" value={formData.coreWeight || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Density (kg/m³):</label>
          <input type="number" value={formData.core_sampling_density || ""} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="coreSamplingImage" accept="image/*" onChange={handleImageChange} disabled={isSubmitted} />

          {imageData?.coreSamplingImage && (
            <div className="image-preview">
              <img src={imageData.coreSamplingImage.preview} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={formData.core_sampling_recommendation || ""} readOnly />
        </>
      )}
    </div>
  );
};

export default CoreSamplingTest;
