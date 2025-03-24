import React, { useState, useEffect } from "react";

const ChlorideTest = ({ formData, setFormData, handleImageChange, imageData, isSubmitted }) => {
  const [showFields, setShowFields] = useState(!!formData.chloride_test);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      chloride_test: value ? "yes" : "no",
      chlorideContent: value ? prev.chlorideContent || "" : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Compute Corrosion Risk
  const computeCorrosionRisk = () => {
    const chlorideContent = parseFloat(formData.chlorideContent) || 0;
    if (chlorideContent >= 0.3) return "High Risk";
    if (chlorideContent >= 0.15) return "Moderate Risk";
    return "Low Risk";
  };

  // ✅ Generate Recommendation
  const generateRecommendation = () => {
    const chlorideContent = parseFloat(formData.chlorideContent) || 0;
    if (chlorideContent >= 0.3) {
      return "High Risk: Immediate protective measures required. Use low-permeability concrete, increase cover thickness, apply corrosion inhibitors, and ensure waterproofing.";
    }
    if (chlorideContent >= 0.15) {
      return "Moderate Risk: Monitor structure regularly. Apply anti-corrosion coatings and ensure proper drainage to prevent chloride penetration.";
    }
    return "Low Risk: No immediate action required. Continue regular structural monitoring and maintenance.";
  };

  // ✅ Memoized Computations
  const corrosionRisk = computeCorrosionRisk();
  const recommendation = generateRecommendation();

  // ✅ Update formData only when necessary
  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        chloride_content: formData.chlorideContent || "N/A",
        chloride_corrosion_risk: corrosionRisk,
        chloride_recommendation: recommendation,
      }));
    }
  }, [formData.chlorideContent, corrosionRisk, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Chloride Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="chloride_test" value="yes" checked={showFields} onChange={handleRadioChange} disabled={isSubmitted} /> Yes
      <input type="radio" name="chloride_test" value="no" checked={!showFields} onChange={handleRadioChange} disabled={isSubmitted} /> No

      {showFields && (
        <>
          <label>Chloride Content (%):</label>
          <input type="number" name="chlorideContent" step="0.01" value={formData.chlorideContent || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Corrosion Risk:</label>
          <input type="text" value={formData.chloride_corrosion_risk || ""} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="chlorideImage" accept="image/*" onChange={handleImageChange} disabled={isSubmitted} />

          {imageData?.chlorideImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imageData.chlorideImage.preview} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={formData.chloride_recommendation || ""} readOnly />
        </>
      )}
    </div>
  );
};

export default ChlorideTest;
