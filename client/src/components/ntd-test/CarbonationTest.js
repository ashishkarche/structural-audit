import React, { useState } from "react";

const CarbonationTest = ({ formData, setFormData }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    setShowFields(e.target.value === "yes");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Determine Recommendation based on Carbonation Depth
  const determineRecommendation = (depth) => {
    if (!depth) return "";
    return depth >= 20 ? "Use low water-cement ratio, increase cover, apply anti-carbonation coatings." : "Satisfactory condition.";
  };

  const recommendation = determineRecommendation(parseFloat(formData.carbonationDepth));

  return (
    <div className="test-section">
      <h3>Carbonation Test</h3>
      <label>Perform Test?</label>
      <input type="radio" name="carbonationTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="carbonationTest" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Depth of Carbonation (mm):</label>
          <input type="number" name="carbonationDepth" value={formData.carbonationDepth || ""} onChange={handleChange} />

          <label>pH Level:</label>
          <input type="number" name="carbonationPH" step="0.1" value={formData.carbonationPH || ""} onChange={handleChange} />

          <label>Recommendation:</label>
          <input type="text" value={recommendation} readOnly />
        </>
      )}
    </div>
  );
};

export default CarbonationTest;
