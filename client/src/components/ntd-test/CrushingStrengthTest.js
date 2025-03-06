import React, { useState, useEffect } from "react";

const CrushingStrengthTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(!!formData.crushing_strength_test);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      crushing_strength_test: value ? {} : null,
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
    if (strength >= 85) return "No action required. The concrete meets the required strength criteria.";
    if (strength >= 75) return "Strength is slightly lower than required. Surface repairs, monitoring, or mild strengthening if necessary.";
    if (strength >= 50) return "Concrete is weak. Detailed structural assessment, strengthening (jacketing, grouting, fiber wrapping) recommended.";
    return "Concrete is highly defective. Immediate intervention, retrofitting, or demolition & reconstruction required.";
  };

  const crushingStrength = parseFloat(formData.crushingStrength);
  const strengthPerformance = determineStrengthPerformance(crushingStrength);
  const recommendation = generateRecommendation(crushingStrength);

  useEffect(() => {
    if (showFields && crushingStrength) {
      setFormData((prev) => ({
        ...prev,
        crushing_strength_test: {
          strength_value: formData.crushingStrength || "N/A",
          classification: strengthPerformance,
          recommendation: recommendation,
        },
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
          <input type="number" name="crushingStrength" step="0.1" value={formData.crushingStrength || ""} onChange={handleChange} />

          <label>Strength Classification:</label>
          <input type="text" value={strengthPerformance} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="crushingStrengthImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews?.crushingStrengthImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.crushingStrengthImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={recommendation} readOnly />
        </>
      )}
    </div>
  );
};

export default CrushingStrengthTest;
