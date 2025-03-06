import React, { useState, useEffect } from "react";

const CrushingStrengthTest = ({ formData, setFormData, handleImageChange, imageData, isSubmitted }) => {
  const [showFields, setShowFields] = useState(!!formData.crushing_strength_test);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      crushing_strength_test: value ? "yes" : "no",
      crushingStrength: value ? prev.crushingStrength || "" : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const determineStrengthPerformance = (strength) => {
    if (!strength) return "";
    if (strength >= 85) return "Good";
    if (strength >= 75) return "Slightly Lower";
    if (strength >= 50) return "Weak";
    return "Highly Defective";
  };

  const generateRecommendation = (strength) => {
    if (!strength) return "";
    if (strength >= 85) return "No action required. Meets required strength.";
    if (strength >= 75) return "Slightly lower than required. Surface repairs recommended.";
    if (strength >= 50) return "Concrete is weak. Structural strengthening needed.";
    return "Highly defective. Immediate intervention or reconstruction required.";
  };

  const crushingStrength = parseFloat(formData.crushingStrength) || 0;
  const strengthPerformance = determineStrengthPerformance(crushingStrength);
  const recommendation = generateRecommendation(crushingStrength);

  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        crushing_strength_classification: strengthPerformance,
        crushing_strength_recommendation: recommendation,
      }));
    }
  }, [crushingStrength, strengthPerformance, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Crushing Strength Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="crushing_strength_test" value="yes" checked={showFields} onChange={handleRadioChange} /> Yes
      <input type="radio" name="crushing_strength_test" value="no" checked={!showFields} onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Compressive Strength (% of Characteristic Strength):</label>
          <input type="number" name="crushingStrength" step="0.1" value={formData.crushingStrength || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Strength Classification:</label>
          <input type="text" value={formData.crushing_strength_classification || ""} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="crushingStrengthImage" accept="image/*" onChange={handleImageChange} disabled={isSubmitted} />

          {imageData?.crushingStrengthImage && (
            <div className="image-preview">
              <img src={imageData.crushingStrengthImage.preview} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={formData.crushing_strength_recommendation || ""} readOnly />
        </>
      )}
    </div>
  );
};

export default CrushingStrengthTest;
