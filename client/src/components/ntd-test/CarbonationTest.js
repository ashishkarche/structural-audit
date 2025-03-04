import React, { useState, useEffect } from "react";

const CarbonationTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(formData.carbonation_test !== null);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      carbonation_test: value ? {} : null,
      carbonationDepth: value ? prev.carbonationDepth || "" : "",
      carbonationPH: value ? prev.carbonationPH || "" : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const computeRecommendation = () => {
    const carbonationDepth = parseFloat(formData.carbonationDepth) || 0;
    return carbonationDepth >= 20
      ? "Use low water-cement ratio, increase cover, apply anti-carbonation coatings."
      : "Satisfactory condition.";
  };

  const recommendation = computeRecommendation();

  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        carbonation_test: {
          carbonation_depth: formData.carbonationDepth || "N/A",
          pH_level: formData.carbonationPH || "N/A",
          recommendation: recommendation,
        },
      }));
    }
  }, [formData.carbonationDepth, formData.carbonationPH, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Carbonation Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="carbonation_test" value="yes" checked={showFields} onChange={handleRadioChange} /> Yes
      <input type="radio" name="carbonation_test" value="no" checked={!showFields} onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Depth of Carbonation (mm):</label>
          <input type="number" name="carbonationDepth" value={formData.carbonationDepth || ""} onChange={handleChange} />

          <label>pH Level:</label>
          <input type="number" name="carbonationPH" step="0.1" value={formData.carbonationPH || ""} onChange={handleChange} />

          <label>Upload Image:</label>
          <input type="file" name="carbonationImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews?.carbonationImage && (
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
