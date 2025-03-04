import React, { useState, useEffect } from "react";

const ReboundHammerTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(!!formData.rebound_hammer_test);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      rebound_hammer_test: value ? {} : null,
      rebound1: value ? prev.rebound1 || "" : "",
      rebound2: value ? prev.rebound2 || "" : "",
      rebound3: value ? prev.rebound3 || "" : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateReboundIndex = () => {
    const values = [formData.rebound1, formData.rebound2, formData.rebound3]
      .map((val) => parseFloat(val) || 0)
      .filter((val) => val > 0);

    return values.length ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2) : "";
  };

  const determineConcreteQuality = (index) => {
    if (!index) return "";
    if (index > 40) return "Very Good";
    if (index >= 30) return "Good";
    if (index >= 20) return "Fair";
    return "Poor";
  };

  const generateRecommendation = (index) => {
    if (!index) return "";
    if (index > 40) return "✅ Low Risk: No intervention required. Regular monitoring recommended.";
    if (index >= 30) return "✔️ Moderate Risk: Surface repairs and monitoring required.";
    if (index >= 20) return "⚠️ High Risk: Detailed investigation and strengthening advised.";
    return "🚨 Severe Risk: Immediate assessment and retrofitting necessary.";
  };

  const reboundIndex = calculateReboundIndex();
  const concreteQuality = determineConcreteQuality(reboundIndex);
  const recommendation = generateRecommendation(reboundIndex);

  useEffect(() => {
    if (showFields && reboundIndex) {
      setFormData((prev) => ({
        ...prev,
        rebound_hammer_test: {
          value: reboundIndex,
          quality: concreteQuality,
          recommendation: recommendation,
        },
      }));
    }
  }, [reboundIndex, concreteQuality, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Rebound Hammer Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="rebound_hammer_test" value="yes" checked={showFields} onChange={handleRadioChange} /> Yes
      <input type="radio" name="rebound_hammer_test" value="no" checked={!showFields} onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Rebound Number 1:</label>
          <input type="number" name="rebound1" value={formData.rebound1 || ""} onChange={handleChange} />

          <label>Rebound Number 2:</label>
          <input type="number" name="rebound2" value={formData.rebound2 || ""} onChange={handleChange} />

          <label>Rebound Number 3:</label>
          <input type="number" name="rebound3" value={formData.rebound3 || ""} onChange={handleChange} />

          <label>Average Rebound Index:</label>
          <input type="number" value={reboundIndex} readOnly />

          <label>Concrete Quality:</label>
          <input type="text" value={concreteQuality} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="reboundHammerImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews?.reboundHammerImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.reboundHammerImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={recommendation} readOnly />
        </>
      )}
    </div>
  );
};

export default ReboundHammerTest;