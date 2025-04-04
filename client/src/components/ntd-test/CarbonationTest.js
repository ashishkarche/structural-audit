import React, { useState, useEffect } from "react";

const CarbonationTest = ({ formData, setFormData, handleImageChange, imageData, isSubmitted }) => {
  const [showFields, setShowFields] = useState(!!formData.carbonation_test);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      carbonation_test: value ? "yes" : "no",
      carbonationDepth: value ? prev.carbonationDepth || "" : "",
      carbonationPH: value ? prev.carbonationPH || "" : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Compute Recommendation
  const computeRecommendation = () => {
    const carbonationDepth = parseFloat(formData.carbonationDepth) || 0;
    return carbonationDepth >= 20
      ? "High Risk: Use low water-cement ratio, increase cover, apply anti-carbonation coatings."
      : "Satisfactory Condition: No immediate action required.";
  };

  // ✅ Memoized Computation
  const recommendation = computeRecommendation();

  // ✅ Update formData only when necessary
  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        carbonation_depth: formData.carbonationDepth || "N/A",
        carbonation_ph_level: formData.carbonationPH || "N/A",
        carbonation_recommendation: recommendation,
      }));
    }
  }, [formData.carbonationDepth, formData.carbonationPH, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Carbonation Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="carbonation_test" value="yes" checked={showFields} onChange={handleRadioChange} disabled={isSubmitted} /> Yes
      <input type="radio" name="carbonation_test" value="no" checked={!showFields} onChange={handleRadioChange} disabled={isSubmitted} /> No

      {showFields && (
        <>
          <label>Depth of Carbonation (mm):</label>
          <input type="number" name="carbonationDepth" value={formData.carbonationDepth || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>pH Level:</label>
          <input type="number" name="carbonationPH" step="0.1" value={formData.carbonationPH || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Upload Image:</label>
          <input type="file" name="carbonationImage" accept="image/*" onChange={handleImageChange} disabled={isSubmitted} />

          {imageData?.carbonationImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imageData.carbonationImage.preview} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={formData.carbonation_recommendation || ""} readOnly />
        </>
      )}
    </div>
  );
};

export default CarbonationTest;
