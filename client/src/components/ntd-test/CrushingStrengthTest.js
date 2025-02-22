import React, { useState, useEffect } from "react";

const CrushingStrengthTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    const value = e.target.value;
    setShowFields(value === "yes");
    setFormData((prev) => ({
      ...prev,
      crushing_strength_test: value === "yes" ? "" : null, // ✅ If "no", set to null
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Determine Strength Performance based on IS 456:2000
  const determineStrengthPerformance = (strength) => {
    if (!strength) return "";
    if (strength >= 85) return "Good";
    if (strength >= 75) return "Slightly Lower";
    if (strength >= 50) return "Weak";
    return "Highly Defective";
  };

  // Generate Recommendations based on Strength Performance
  const generateRecommendation = (strength) => {
    if (!strength) return "";

    if (strength >= 85) {
      return "✅ No action required. The concrete meets the required strength criteria.";
    }
    if (strength >= 75) {
      return "✔️ Strength is slightly lower than required. Surface repairs, monitoring, or mild strengthening if necessary.";
    }
    if (strength >= 50) {
      return "⚠️ Concrete is weak. Detailed structural assessment, strengthening (jacketing, grouting, fiber wrapping) recommended.";
    }
    return "❌ Concrete is highly defective. Immediate intervention, retrofitting, or demolition & reconstruction required.";
  };

  const crushingStrength = parseFloat(formData.crushingStrength);
  const strengthPerformance = determineStrengthPerformance(crushingStrength);
  const recommendation = generateRecommendation(crushingStrength);

  // ✅ Store test result as a JSON string
  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        crushing_strength_test: JSON.stringify({
          strength_value: crushingStrength || "N/A",
          classification: strengthPerformance,
          recommendation: recommendation,
        }),
      }));
    }
  }, [crushingStrength, strengthPerformance, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Crushing Strength Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="crushing_strength_test" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="crushing_strength_test" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Compressive Strength (% of Characteristic Strength):</label>
          <input type="number" name="crushingStrength" step="0.1" value={formData.crushingStrength || ""} onChange={handleChange} />

          <label>Strength Classification:</label>
          <input type="text" value={strengthPerformance} readOnly />

          {/* ✅ Image Upload Section */}
          <label>Upload Image:</label>
          <input type="file" name="crushingStrengthImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews.crushingStrengthImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.crushingStrengthImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          {/* ✅ Recommendation Box */}
          {recommendation && (
            <div className="recommendation-box">
              <h4>Recommendation (As per IS 456:2000 & IS 516:1959):</h4>
              <p>{recommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CrushingStrengthTest;
