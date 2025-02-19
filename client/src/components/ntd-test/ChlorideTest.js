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

  // Determine Corrosion Risk based on Chloride Content
  const determineCorrosionRisk = (chloride) => {
    if (!chloride) return "";
    if (chloride > 0.3) return "High Risk - Immediate Protective Measures Needed";
    if (chloride >= 0.15) return "Moderate Risk - Monitor & Apply Coatings";
    return "Low Risk - No Immediate Action Needed";
  };

  const corrosionRisk = determineCorrosionRisk(parseFloat(formData.chlorideContent));

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

          <label>Corrosion Risk & Recommendation:</label>
          <input type="text" value={corrosionRisk} readOnly />
        </>
      )}
    </div>
  );
};

export default ChlorideTest;
