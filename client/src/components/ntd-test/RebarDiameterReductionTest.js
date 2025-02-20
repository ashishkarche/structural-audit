import React, { useState } from "react";

const RebarDiameterReductionTest = ({ formData, setFormData }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    setShowFields(e.target.value === "yes");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const reductionPercentage = computeReductionPercentage();
  const structuralImpact = determineStructuralImpact(parseFloat(reductionPercentage));
  const recommendation = generateRecommendation(parseFloat(reductionPercentage));

  return (
    <div className="test-section">
      <h3>Rebar Diameter Reduction Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="rebarDiameterTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="rebarDiameterTest" value="no" onChange={handleRadioChange} /> No

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
