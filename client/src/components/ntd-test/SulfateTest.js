import React, { useState } from "react";

const SulfateTest = ({ formData, setFormData }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    setShowFields(e.target.value === "yes");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Determine Deterioration Risk based on Sulfate Content (As per IS 12330:1988)
  const determineDeteriorationRisk = (sulfate) => {
    if (!sulfate) return "";
    if (sulfate >= 0.1) return "High Risk";
    return "Low Risk";
  };

  // Generate Recommendations based on Sulfate Risk
  const generateRecommendation = (sulfate) => {
    if (!sulfate) return "";

    if (sulfate >= 0.1) {
      return "❌ High Risk: Use sulfate-resistant cement (SRC) as per IS 12330:1988. Reduce water-cement ratio, ensure proper curing, and apply protective coatings.";
    }
    return "✅ Low Risk: No immediate action required. Continue routine maintenance and monitoring.";
  };

  const sulfateContent = parseFloat(formData.sulfateContent);
  const deteriorationRisk = determineDeteriorationRisk(sulfateContent);
  const recommendation = generateRecommendation(sulfateContent);

  return (
    <div className="test-section">
      <h3>Sulfate Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="sulfateTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="sulfateTest" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Sulfate Content (%):</label>
          <input type="number" name="sulfateContent" step="0.01" value={formData.sulfateContent || ""} onChange={handleChange} />

          <label>Deterioration Risk:</label>
          <input type="text" value={deteriorationRisk} readOnly />

          {/* ✅ Recommendation Box */}
          {recommendation && (
            <div className="recommendation-box">
              <h4>Recommendation (As per IS 12330:1988):</h4>
              <p>{recommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SulfateTest;
