import React, { useState, useEffect } from "react";

const RebarDiameterReductionTest = ({ formData, setFormData, handleImageChange, imageData, isSubmitted }) => {
  const [showFields, setShowFields] = useState(!!formData.originalRebarDiameter);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      originalRebarDiameter: value ? prev.originalRebarDiameter || "" : null,
      measuredRebarDiameter: value ? prev.measuredRebarDiameter || "" : null,
      rebar_reduction: value ? prev.rebar_reduction || "" : null,
      rebar_impact: value ? prev.rebar_impact || "" : null,
      rebar_recommendation: value ? prev.rebar_recommendation || "" : null,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateReductionPercentage = () => {
    const original = parseFloat(formData.originalRebarDiameter) || 1;
    const measured = parseFloat(formData.measuredRebarDiameter) || 0;
    return (((original - measured) / original) * 100).toFixed(2);
  };

  const determineStructuralImpact = (reduction) => {
    if (!reduction || reduction <= 0) return "No Reduction Detected";
    if (reduction > 20) return "High Impact - Immediate repair required.";
    if (reduction >= 10) return "Moderate Impact - Apply protective coatings.";
    return "Low Impact - No immediate action required.";
  };

  const generateRecommendation = (reduction) => {
    if (!reduction || reduction <= 0) return "✅ No Reduction Detected.";
    if (reduction > 20) return "❌ High Impact: Structural strengthening needed.";
    return "⚠️ Moderate Impact: Apply protective coatings and corrosion inhibitors.";
  };

  const reductionPercentage = calculateReductionPercentage();
  const structuralImpact = determineStructuralImpact(parseFloat(reductionPercentage));
  const recommendation = generateRecommendation(parseFloat(reductionPercentage));

  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        rebar_reduction: reductionPercentage,
        rebar_impact: structuralImpact,
        rebar_recommendation: recommendation,
      }));
    }
  }, [reductionPercentage, structuralImpact, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Rebar Diameter Reduction Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="rebar_test" value="yes" checked={showFields} onChange={handleRadioChange} disabled={isSubmitted} /> Yes
      <input type="radio" name="rebar_test" value="no" checked={!showFields} onChange={handleRadioChange} disabled={isSubmitted} /> No

      {showFields && (
        <>
          <label>Original Rebar Diameter (mm):</label>
          <input type="number" name="originalRebarDiameter" value={formData.originalRebarDiameter || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Measured Rebar Diameter (mm):</label>
          <input type="number" name="measuredRebarDiameter" value={formData.measuredRebarDiameter || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Diameter Reduction (%):</label>
          <input type="number" value={formData.rebar_reduction || ""} readOnly />

          <label>Structural Impact:</label>
          <input type="text" value={formData.rebar_impact || ""} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="rebarDiameterImage" accept="image/*" onChange={handleImageChange} disabled={isSubmitted} />

          {imageData?.rebarDiameterImage && (
            <div className="image-preview">
              <img src={imageData.rebarDiameterImage.preview} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={formData.rebar_recommendation || ""} readOnly />
        </>
      )}
    </div>
  );
};

export default RebarDiameterReductionTest;
