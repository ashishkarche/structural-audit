import React, { useState } from "react";

const ChlorideTest = ({ formData, setFormData }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    setShowFields(e.target.value === "yes");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Determine Corrosion Risk based on Chloride Content (As per IS 456:2000)
  const determineCorrosionRisk = (chloride) => {
    if (!chloride) return "";
    if (chloride >= 0.3) return "High Risk";
    if (chloride >= 0.15) return "Moderate Risk";
    return "Low Risk";
  };

  // Generate Recommendations based on Corrosion Risk
  const generateRecommendation = (chloride) => {
    if (!chloride) return "";

    if (chloride >= 0.3) {
      return "❌ High Risk: Immediate protective measures required. Use low-permeability concrete, increase cover thickness, apply corrosion inhibitors, and ensure waterproofing.";
    }
    if (chloride >= 0.15) {
      return "⚠️ Moderate Risk: Monitor structure regularly. Apply anti-corrosion coatings and ensure proper drainage to prevent chloride penetration.";
    }
    return "✅ Low Risk: No immediate action required. Continue regular structural monitoring and maintenance.";
  };

  const chlorideContent = parseFloat(formData.chlorideContent);
  const corrosionRisk = determineCorrosionRisk(chlorideContent);
  const recommendation = generateRecommendation(chlorideContent);

  return (
    <div className="test-section">
      <h3>Chloride Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="chlorideTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="chlorideTest" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Chloride Content (%):</label>
          <input type="number" name="chlorideContent" step="0.01" value={formData.chlorideContent || ""} onChange={handleChange} />

          <label>Corrosion Risk:</label>
          <input type="text" value={corrosionRisk} readOnly />

          {/* ✅ Recommendation Box */}
          {recommendation && (
            <div className="recommendation-box">
              <h4>Recommendation (As per IS 456:2000):</h4>
              <p>{recommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChlorideTest;
