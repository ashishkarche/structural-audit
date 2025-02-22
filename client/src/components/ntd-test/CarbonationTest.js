import React, { useState, useEffect } from "react";

const CarbonationTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    const value = e.target.value;
    setShowFields(value === "yes");
    setFormData((prev) => ({
      ...prev,
      carbonation_test: value === "yes" ? "" : null, // ✅ If "no", set to null
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Determine Recommendation based on Carbonation Depth
  const determineRecommendation = (depth) => {
    if (!depth) return "";
    return depth >= 20
      ? "Use low water-cement ratio, increase cover, apply anti-carbonation coatings."
      : "Satisfactory condition.";
  };

  const carbonationDepth = parseFloat(formData.carbonationDepth);
  const recommendation = determineRecommendation(carbonationDepth);

  // ✅ Store test result as a JSON string
  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        carbonation_test: JSON.stringify({
          carbonation_depth: formData.carbonationDepth || "N/A",
          pH_level: formData.carbonationPH || "N/A",
          recommendation: recommendation,
        }),
      }));
    }
  }, [carbonationDepth, formData.carbonationPH, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Carbonation Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="carbonationTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="carbonationTest" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Depth of Carbonation (mm):</label>
          <input type="number" name="carbonationDepth" value={formData.carbonationDepth || ""} onChange={handleChange} />

          <label>pH Level:</label>
          <input type="number" name="carbonationPH" step="0.1" value={formData.carbonationPH || ""} onChange={handleChange} />

          {/* ✅ Image Upload Section */}
          <label>Upload Image:</label>
          <input type="file" name="carbonationImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews.carbonationImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.carbonationImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={recommendation} readOnly />
        </>
      )}
    </div>
  );
};

export default CarbonationTest;
