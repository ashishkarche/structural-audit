import React, { useState, useEffect } from "react";

const SulfateTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(formData.sulfate_test !== null);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      sulfate_test: value ? {} : null,
      sulfateContent: value ? prev.sulfateContent || "" : "",
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
      ? "❌ High Risk: Use sulfate-resistant cement (SRC) as per IS 12330:1988. Reduce water-cement ratio, ensure proper curing, and apply protective coatings."
      : "✅ Low Risk: No immediate action required. Continue routine maintenance and monitoring.";
  };

  // ✅ Memoized Computations
  const sulfateContent = parseFloat(formData.sulfateContent) || 0;
  const deteriorationRisk = determineDeteriorationRisk(sulfateContent);
  const recommendation = generateRecommendation(sulfateContent);

  // ✅ Update formData only when necessary
  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        sulfate_test: JSON.stringify({
          sulfate_content: formData.sulfateContent || "N/A",
          deterioration_risk: deteriorationRisk,
          recommendation: recommendation,
        }),
      }));
    }
  }, [sulfateContent, deteriorationRisk, recommendation, showFields, setFormData]);

  // ✅ Safely parse stored JSON data
  let testData = {};
  try {
    testData = JSON.parse(formData.sulfate_test || "{}");
  } catch (error) {
    testData = {};
  }

  return (
    <div className="test-section">
      <h3>Sulfate Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="sulfate_test" value="yes" checked={showFields} onChange={handleRadioChange} /> Yes
      <input type="radio" name="sulfate_test" value="no" checked={!showFields} onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Sulfate Content (%):</label>
          <input type="number" name="sulfateContent" step="0.01" value={formData.sulfateContent || ""} onChange={handleChange} />

          <label>Deterioration Risk:</label>
          <input type="text" value={testData.deterioration_risk || ""} readOnly />

          {/* ✅ Image Upload Section */}
          <label>Upload Image:</label>
          <input type="file" name="sulfateImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews?.sulfateImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.sulfateImage} alt="Uploaded Test" width="200px" />
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

export default SulfateTest;
