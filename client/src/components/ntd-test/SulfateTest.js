import React, { useState, useEffect } from "react";

const SulfateTest = ({ formData, setFormData, handleImageChange, imageData, isSubmitted }) => {
  const [showFields, setShowFields] = useState(!!formData.sulfate_content);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      sulfate_content: value ? prev.sulfate_content || "" : null,
      sulfate_deterioration_risk: value ? prev.sulfate_deterioration_risk || "" : null,
      sulfate_recommendation: value ? prev.sulfate_recommendation || "" : null,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Determine Deterioration Risk
  const determineDeteriorationRisk = (sulfate) => {
    return sulfate >= 0.1 ? "High Risk" : "Low Risk";
  };

  // ✅ Generate Recommendation
  const generateRecommendation = (sulfate) => {
    return sulfate >= 0.1
      ? "High Risk: Use sulfate-resistant cement (SRC) as per IS 12330:1988. Reduce water-cement ratio, ensure proper curing, and apply protective coatings."
      : "Low Risk: No immediate action required. Continue routine maintenance and monitoring.";
  };

  // ✅ Auto-update risk & recommendation when sulfate content changes
  useEffect(() => {
    if (showFields) {
      const sulfateValue = parseFloat(formData.sulfate_content) || 0;
      const deteriorationRisk = determineDeteriorationRisk(sulfateValue);
      const recommendation = generateRecommendation(sulfateValue);

      setFormData((prev) => ({
        ...prev,
        sulfate_deterioration_risk: deteriorationRisk,
        sulfate_recommendation: recommendation,
      }));
    }
  }, [formData.sulfate_content, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Sulfate Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="sulfate_test" value="yes" checked={showFields} onChange={handleRadioChange} disabled={isSubmitted} /> Yes
      <input type="radio" name="sulfate_test" value="no" checked={!showFields} onChange={handleRadioChange} disabled={isSubmitted} /> No

      {showFields && (
        <>
          <label>Sulfate Content (%):</label>
          <input type="number" name="sulfate_content" step="0.01" value={formData.sulfate_content || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Deterioration Risk:</label>
          <input type="text" name="sulfate_deterioration_risk" value={formData.sulfate_deterioration_risk || ""} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="sulfateImage" accept="image/*" onChange={handleImageChange} disabled={isSubmitted} />

          {imageData?.sulfateImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imageData.sulfateImage.preview} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" name="sulfate_recommendation" value={formData.sulfate_recommendation || ""} readOnly />
        </>
      )}
    </div>
  );
};

export default SulfateTest;
