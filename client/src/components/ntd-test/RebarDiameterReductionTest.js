import React, { useState, useEffect } from "react";

const RebarDiameterReductionTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    const value = e.target.value;
    setShowFields(value === "yes");
    setFormData((prev) => ({
      ...prev,
      rebar_diameter_test: value === "yes" ? "" : null, // ✅ If "no", set to null
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChangeLocal = (e) => {
    handleImageChange(e); // ✅ Pass to parent handler
  };

  // Compute Rebar Diameter Reduction Percentage
  const computeReductionPercentage = () => {
    const originalDiameter = parseFloat(formData.originalRebarDiameter) || 1;
    const measuredDiameter = parseFloat(formData.measuredRebarDiameter) || 0;
    return (((originalDiameter - measuredDiameter) / originalDiameter) * 100).toFixed(2);
  };

  // Determine Structural Impact based on Reduction Percentage
  const determineStructuralImpact = (reduction) => {
    if (!reduction || reduction <= 0) return "No Reduction Detected";
    if (reduction > 20) return "High Impact - Immediate repair required.";
    if (reduction >= 10) return "Moderate Impact - Apply protective coatings and corrosion inhibitors.";
    return "Low Impact - No immediate action required.";
  };

  // Generate Recommendations based on Rebar Reduction
  const generateRecommendation = (reduction) => {
    if (!reduction || reduction <= 0) {
      return "✅ No Reduction Detected: No immediate action needed.";
    }
    if (reduction > 20) {
      return "❌ High Impact: Immediate repair required. Rebar strengthening/replacement or structural rehabilitation necessary.";
    }
    if (reduction >= 10) {
      return "⚠️ Moderate Impact: Apply protective coatings, use corrosion inhibitors, and monitor regularly.";
    }
    return "✔️ Low Impact: No immediate action required, but periodic monitoring is recommended.";
  };

  // ✅ Compute and store test result
  const reductionPercentage = computeReductionPercentage();
  const structuralImpact = determineStructuralImpact(parseFloat(reductionPercentage));
  const recommendation = generateRecommendation(parseFloat(reductionPercentage));

  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        rebar_diameter_test: JSON.stringify({
          reduction_percentage: reductionPercentage,
          impact: structuralImpact,
          recommendation: recommendation,
        }),
      }));
    }
  }, [reductionPercentage, structuralImpact, recommendation, showFields]);

  return (
    <div className="test-section">
      <h3>Rebar Diameter Reduction Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="rebar_diameter_test" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="rebar_diameter_test" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Original Rebar Diameter (mm):</label>
          <input type="number" name="originalRebarDiameter" value={formData.originalRebarDiameter || ""} onChange={handleChange} />

          <label>Measured Rebar Diameter (mm):</label>
          <input type="number" name="measuredRebarDiameter" value={formData.measuredRebarDiameter || ""} onChange={handleChange} />

          <label>Diameter Reduction (%):</label>
          <input type="number" value={reductionPercentage} readOnly />

          <label>Structural Impact:</label>
          <input type="text" value={structuralImpact} readOnly />

          {/* ✅ Image Upload Section */}
          <label>Upload Image:</label>
          <input type="file" name="rebarDiameterImage" accept="image/*" onChange={handleImageChangeLocal} />

          {imagePreviews.rebarDiameterImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.rebarDiameterImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          {/* ✅ Recommendation Box */}
          {recommendation && (
            <div className="recommendation-box">
              <h4>Recommendation (As per IS Standards):</h4>
              <p>{recommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RebarDiameterReductionTest;
