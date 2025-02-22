import React, { useState } from "react";

const ReboundHammerTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    const value = e.target.value;
    setShowFields(value === "yes");
    setFormData((prev) => ({
      ...prev,
      rebound_hammer_test: value === "yes" ? "" : null, // ✅ If "no", set it to null
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChangeLocal = (e) => {
    handleImageChange(e); // ✅ Pass to parent handler
  };

  // Calculate Rebound Index (Average of entered values)
  const calculateReboundIndex = () => {
    const values = [
      parseFloat(formData.rebound1) || 0,
      parseFloat(formData.rebound2) || 0,
      parseFloat(formData.rebound3) || 0,
    ];
    const validValues = values.filter((val) => val > 0);
    if (validValues.length === 0) return "";
    return (validValues.reduce((sum, val) => sum + val, 0) / validValues.length).toFixed(2);
  };

  // Determine Concrete Quality based on Rebound Index
  const determineConcreteQuality = (index) => {
    if (!index) return "";
    if (index > 40) return "Very Good";
    if (index >= 30) return "Good";
    if (index >= 20) return "Fair";
    if (index < 20 && index > 0) return "Poor";
    return "Very Poor";
  };

  // Generate Recommendations based on Concrete Quality
  const generateRecommendation = (index) => {
    if (!index) return "";

    if (index > 40) {
      return "✅ Low Risk: No immediate intervention required. Regular monitoring and preventive maintenance recommended.";
    }
    if (index >= 30) {
      return "✔️ Moderate Risk: Structural integrity is sound, but minor maintenance such as surface repairs and sealing of minor cracks may be required. Digital monitoring should be implemented for long-term tracking.";
    }
    if (index >= 20) {
      return "⚠️ High Risk: Possible degradation of concrete quality. Detailed investigation with ultrasonic pulse velocity (UPV) test recommended. Repairs such as grouting, polymer-based surface treatment, or strengthening measures should be considered.";
    }
    return "🚨 Severe Risk: Significant deterioration is likely. Immediate structural assessment with core cutting, carbonation depth testing, and corrosion potential assessment is necessary. Strengthening or retrofitting measures as per IS 456:2000 should be undertaken.";
  };

  // Compute and store full test result
  const reboundIndex = calculateReboundIndex();
  const concreteQuality = determineConcreteQuality(reboundIndex);
  const recommendation = generateRecommendation(reboundIndex);

  // ✅ Store full test result as JSON string
  if (showFields) {
    setFormData((prev) => ({
      ...prev,
      rebound_hammer_test: JSON.stringify({
        value: reboundIndex,
        quality: concreteQuality,
        recommendation: recommendation,
      }),
    }));
  }

  return (
    <div className="test-section">
      <h3>Rebound Hammer Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="rebound_hammer_test" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="rebound_hammer_test" value="no" onChange={handleRadioChange} /> No

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

          {/* ✅ Image Upload Section */}
          <label>Upload Image:</label>
          <input type="file" name="reboundHammerImage" accept="image/*" onChange={handleImageChangeLocal} />

          {imagePreviews.reboundHammerImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.reboundHammerImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          {/* ✅ Recommendation Box */}
          {recommendation && (
            <div className="recommendation-box">
              <h4>Recommendation (As per IS 13311 Part-1:1992 & IS 456:2000):</h4>
              <p>{recommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReboundHammerTest;
