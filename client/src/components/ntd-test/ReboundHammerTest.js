import React, { useState, useEffect } from "react";

const ReboundHammerTest = ({ formData, setFormData, handleImageChange, imageData, isSubmitted }) => {
  const [showFields, setShowFields] = useState(!!formData.rebound1);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      rebound1: value ? prev.rebound1 || "" : null,
      rebound2: value ? prev.rebound2 || "" : null,
      rebound3: value ? prev.rebound3 || "" : null,
      rebound_index: value ? prev.rebound_index || "" : null,
      rebound_quality: value ? prev.rebound_quality || "" : null,
      rebound_recommendation: value ? prev.rebound_recommendation || "" : null,
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
    if (index > 40) return "Low Risk: No intervention required.";
    if (index >= 30) return "Moderate Risk: Surface repairs recommended.";
    if (index >= 20) return "High Risk: Strengthening needed.";
    return "Severe Risk: Immediate retrofitting required.";
  };

  const reboundIndex = calculateReboundIndex();
  const concreteQuality = determineConcreteQuality(reboundIndex);
  const recommendation = generateRecommendation(reboundIndex);

  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        rebound_index: reboundIndex,
        rebound_quality: concreteQuality,
        rebound_recommendation: recommendation,
      }));
    }
  }, [reboundIndex, concreteQuality, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Rebound Hammer Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="rebound_test" value="yes" checked={showFields} onChange={handleRadioChange} disabled={isSubmitted} /> Yes
      <input type="radio" name="rebound_test" value="no" checked={!showFields} onChange={handleRadioChange} disabled={isSubmitted} /> No

      {showFields && (
        <>
          <label>Rebound Number 1:</label>
          <input type="number" name="rebound1" value={formData.rebound1 || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Rebound Number 2:</label>
          <input type="number" name="rebound2" value={formData.rebound2 || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Rebound Number 3:</label>
          <input type="number" name="rebound3" value={formData.rebound3 || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Average Rebound Index:</label>
          <input type="number" name="rebound_index" value={formData.rebound_index || ""} readOnly />

          <label>Concrete Quality:</label>
          <input type="text" name="rebound_quality" value={formData.rebound_quality || ""} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="reboundHammerImage" accept="image/*" onChange={handleImageChange} disabled={isSubmitted} />

          {imageData?.reboundHammerImage && (
            <div className="image-preview">
              <img src={imageData.reboundHammerImage.preview} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" name="rebound_recommendation" value={formData.rebound_recommendation || ""} readOnly />
        </>
      )}
    </div>
  );
};

export default ReboundHammerTest;
