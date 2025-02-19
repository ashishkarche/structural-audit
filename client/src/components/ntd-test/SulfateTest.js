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

  // Determine Deterioration Risk based on Sulfate Content
  const determineDeteriorationRisk = (sulfate) => {
    if (!sulfate) return "";
    if (sulfate > 0.25) return "High Risk - Immediate Sulfate-Resistant Measures Needed";
    if (sulfate >= 0.1) return "Moderate Risk - Use Sulfate-Resistant Cement & Coatings";
    return "Low Risk - No Immediate Action Needed";
  };

  const deteriorationRisk = determineDeteriorationRisk(parseFloat(formData.sulfateContent));

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

          <label>Deterioration Risk & Recommendation:</label>
          <input type="text" value={deteriorationRisk} readOnly />
        </>
      )}
    </div>
  );
};

export default SulfateTest;
