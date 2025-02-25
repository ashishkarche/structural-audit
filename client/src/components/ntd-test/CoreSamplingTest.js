import React, { useState, useEffect } from "react";

const CoreSamplingTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(formData.core_sampling_test !== null);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      core_sampling_test: value ? {} : null,
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

  // ✅ Compute L/D Ratio
  const computeLD = () => {
    const length = parseFloat(formData.coreLength) || 0;
    const diameter = parseFloat(formData.coreDiameter) || 1;
    return (length / diameter).toFixed(2);
  };

  // ✅ Get Correction Factor based on L/D Ratio
  const getCorrectionFactor = (ldRatio) => {
    if (ldRatio >= 2) return 1;
    if (ldRatio >= 1.75) return 0.98;
    if (ldRatio >= 1.5) return 0.96;
    if (ldRatio >= 1.25) return 0.93;
    return 0.90;
  };

  // ✅ Compute Corrected Strength
  const computeCorrectedStrength = () => {
    const strength = parseFloat(formData.coreStrength) || 0;
    return (strength * getCorrectionFactor(computeLD())).toFixed(2);
  };

  // ✅ Compute Density
  const computeDensity = () => {
    const weight = parseFloat(formData.coreWeight) || 0;
    const diameter = parseFloat(formData.coreDiameter) || 1;
    const length = parseFloat(formData.coreLength) || 1;
    const volume = Math.PI * Math.pow(diameter / 2000, 2) * (length / 1000);
    return volume > 0 ? (weight / volume).toFixed(2) : "";
  };

  // ✅ Generate Recommendation
  const generateRecommendation = (correctedStrength) => {
    if (!correctedStrength) return "⚠️ No data available.";
    if (correctedStrength >= 85) return "✅ The concrete meets the required strength criteria. No action required.";
    if (correctedStrength >= 75) return "✔️ Strength is slightly lower. Monitoring & minor surface repairs recommended.";
    if (correctedStrength >= 50) return "⚠️ Strength is weak. Structural strengthening using jacketing, grouting advised.";
    return "❌ Highly defective concrete. Immediate intervention, retrofitting, or replacement needed.";
  };

  // ✅ Memoized Computations
  const lD_Ratio = computeLD();
  const correctedStrength = computeCorrectedStrength();
  const density = computeDensity();
  const recommendation = generateRecommendation(parseFloat(correctedStrength));

  // ✅ Update formData only when necessary
  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        core_sampling_test: JSON.stringify({
          core_diameter: formData.coreDiameter || "N/A",
          core_length: formData.coreLength || "N/A",
          lD_Ratio: lD_Ratio,
          measured_strength: formData.coreStrength || "N/A",
          corrected_strength: correctedStrength,
          density: density,
          recommendation: recommendation,
        }),
      }));
    }
  }, [lD_Ratio, correctedStrength, density, formData.coreDiameter, formData.coreLength, formData.coreStrength, showFields, setFormData]);

  // ✅ Safely parse stored JSON data
  let testData = {};
  try {
    testData = JSON.parse(formData.core_sampling_test || "{}");
  } catch (error) {
    testData = {};
  }

  return (
    <div className="test-section">
      <h3>Core Sampling Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="core_sampling_test" value="yes" checked={showFields} onChange={handleRadioChange} /> Yes
      <input type="radio" name="core_sampling_test" value="no" checked={!showFields} onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Core Diameter (mm):</label>
          <input type="number" name="coreDiameter" value={formData.coreDiameter || ""} onChange={handleChange} />

          <label>Core Length (mm):</label>
          <input type="number" name="coreLength" value={formData.coreLength || ""} onChange={handleChange} />

          <label>L/D Ratio:</label>
          <input type="number" value={testData.lD_Ratio || ""} readOnly />

          <label>Measured Compressive Strength (MPa):</label>
          <input type="number" name="coreStrength" value={formData.coreStrength || ""} onChange={handleChange} />

          <label>Corrected Strength (MPa):</label>
          <input type="number" value={testData.corrected_strength || ""} readOnly />

          <label>Core Weight (kg):</label>
          <input type="number" name="coreWeight" value={formData.coreWeight || ""} onChange={handleChange} />

          <label>Density (kg/m³):</label>
          <input type="number" value={testData.density || ""} readOnly />

          {/* ✅ Image Upload Section */}
          <label>Upload Image:</label>
          <input type="file" name="coreSamplingImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews?.coreSamplingImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.coreSamplingImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          {/* ✅ Recommendation Box */}
          <label>Recommendation:</label>
          <input type="text" value={testData.recommendation || ""} readOnly />
        </>
      )}
    </div>
  );
};

export default CoreSamplingTest;
