import React, { useState, useEffect } from "react";

const ChlorideTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(formData.chloride_test !== null);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      chloride_test: value ? {} : null,
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
      return "❌ High Risk: Immediate protective measures required. Use low-permeability concrete, increase cover thickness, apply corrosion inhibitors, and ensure waterproofing.";
    }
    if (chlorideContent >= 0.15) {
      return "⚠️ Moderate Risk: Monitor structure regularly. Apply anti-corrosion coatings and ensure proper drainage to prevent chloride penetration.";
    }
    return "✅ Low Risk: No immediate action required. Continue regular structural monitoring and maintenance.";
  };

  // ✅ Memoized Computations
  const corrosionRisk = computeCorrosionRisk();
  const recommendation = generateRecommendation();

  // ✅ Update formData only when necessary
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
  }, [formData.chlorideContent, corrosionRisk, recommendation, showFields, setFormData]);

  // ✅ Safely parse stored JSON data
  let testData = {};
  try {
    testData = JSON.parse(formData.chloride_test || "{}");
  } catch (error) {
    testData = {};
  }

  return (
    <div className="test-section">
      <h3>Chloride Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="chloride_test" value="yes" checked={showFields} onChange={handleRadioChange} /> Yes
      <input type="radio" name="chloride_test" value="no" checked={!showFields} onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Chloride Content (%):</label>
          <input type="number" name="chlorideContent" step="0.01" value={formData.chlorideContent || ""} onChange={handleChange} />

          <label>Corrosion Risk:</label>
          <input type="text" value={testData.corrosion_risk || ""} readOnly />

          {/* ✅ Image Upload Section */}
          <label>Upload Image:</label>
          <input type="file" name="chlorideImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews?.chlorideImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.chlorideImage} alt="Uploaded Test" width="200px" />
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

export default ChlorideTest;
