import React, { useState, useEffect } from "react";

const ChlorideTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    const value = e.target.value;
    setShowFields(value === "yes");
    setFormData((prev) => ({
      ...prev,
      chloride_test: value === "yes" ? "" : null, // ✅ If "no", set to null
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Determine Corrosion Risk based on Chloride Content (As per IS 456:2000)
  const determineCorrosionRisk = (chloride) => {
    if (!chloride) return "";
    if (chloride >= 0.3) return "High Risk";
    if (chloride >= 0.15) return "Moderate Risk";
    return "Low Risk";
  };

  // Generate Recommendations based on Corrosion Risk
  const generateRecommendation = (chloride) => {
    if (!chloride) return "";

    if (chloride >= 0.3) {
      return "❌ High Risk: Immediate protective measures required. Use low-permeability concrete, increase cover thickness, apply corrosion inhibitors, and ensure waterproofing.";
    }
    if (chloride >= 0.15) {
      return "⚠️ Moderate Risk: Monitor structure regularly. Apply anti-corrosion coatings and ensure proper drainage to prevent chloride penetration.";
    }
    return "✅ Low Risk: No immediate action required. Continue regular structural monitoring and maintenance.";
  };

  const chlorideContent = parseFloat(formData.chlorideContent);
  const corrosionRisk = determineCorrosionRisk(chlorideContent);
  const recommendation = generateRecommendation(chlorideContent);

  // ✅ Store test result as a JSON string
  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        chloride_test: JSON.stringify({
          chloride_content: formData.chlorideContent || "N/A",
          corrosion_risk: corrosionRisk,
          recommendation: recommendation,
        }),
      }));
    }
  }, [chlorideContent, corrosionRisk, formData.chlorideContent, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Chloride Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="chlorideTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="chlorideTest" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Chloride Content (%):</label>
          <input type="number" name="chlorideContent" step="0.01" value={formData.chlorideContent || ""} onChange={handleChange} />

          <label>Corrosion Risk:</label>
          <input type="text" value={corrosionRisk} readOnly />

          {/* ✅ Image Upload Section */}
          <label>Upload Image:</label>
          <input type="file" name="chlorideImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews.chlorideImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.chlorideImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          {/* ✅ Recommendation Box */}
          {recommendation && (
            <div className="recommendation-box">
              <h4>Recommendation (As per IS 456:2000):</h4>
              <p>{recommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChlorideTest;
