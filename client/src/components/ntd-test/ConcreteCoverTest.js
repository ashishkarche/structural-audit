import React, { useState } from "react";

const ConcreteCoverTest = ({ formData, setFormData }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    setShowFields(e.target.value === "yes");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Compute Cover Deficiency
  const computeCoverDeficiency = () => {
    const requiredCover = parseFloat(formData.concreteCoverRequired) || 0;
    const measuredCover = parseFloat(formData.concreteCoverMeasured) || 0;
    return (requiredCover - measuredCover).toFixed(2);
  };

  // Determine Structural Risk based on Cover Deficiency
  const determineStructuralRisk = (deficiency) => {
    if (!deficiency || deficiency <= 0) return "Adequate Cover";
    if (deficiency > 10) return "Severe Cover Deficiency";
    if (deficiency >= 5) return "Moderate Cover Deficiency";
    return "Minor Cover Deficiency";
  };

  // Generate Recommendations based on Cover Deficiency
  const generateRecommendation = (deficiency) => {
    if (!deficiency || deficiency <= 0) {
      return "✅ Adequate Cover: Continue regular structural monitoring and maintenance.";
    }
    if (deficiency > 10) {
      return "❌ Severe Cover Deficiency: Immediate action required. Apply protective coatings (IS 13620), use corrosion inhibitors (IS 9077), repair using micro-concrete/polymer-modified mortar (IS 13935). Structural strengthening may be required.";
    }
    if (deficiency >= 5) {
      return "⚠️ Moderate Cover Deficiency: Apply surface protection coatings, improve waterproofing (IS 2645), and conduct periodic inspections.";
    }
    return "✔️ Minor Cover Deficiency: No immediate action needed, but monitor regularly. Ensure proper curing and maintenance practices.";
  };

  const coverDeficiency = computeCoverDeficiency();
  const structuralRisk = determineStructuralRisk(parseFloat(coverDeficiency));
  const recommendation = generateRecommendation(parseFloat(coverDeficiency));

  return (
    <div className="test-section">
      <h3>Concrete Cover Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="concreteCoverTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="concreteCoverTest" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Required Cover (mm):</label>
          <input type="number" name="concreteCoverRequired" value={formData.concreteCoverRequired || ""} onChange={handleChange} />

          <label>Measured Cover (mm):</label>
          <input type="number" name="concreteCoverMeasured" value={formData.concreteCoverMeasured || ""} onChange={handleChange} />

          <label>Cover Deficiency (mm):</label>
          <input type="number" value={coverDeficiency} readOnly />

          <label>Structural Risk:</label>
          <input type="text" value={structuralRisk} readOnly />

          {/* ✅ Recommendation Box */}
          {recommendation && (
            <div className="recommendation-box">
              <h4>Recommendation (As per IS 13620, IS 9077, IS 2645, IS 13935):</h4>
              <p>{recommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConcreteCoverTest;
