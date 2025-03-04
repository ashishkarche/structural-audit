import React, { useState, useEffect } from "react";

const RebarDiameterReductionTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(!!formData.rebar_diameter_test);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      rebar_diameter_test: value ? {} : null,
      originalRebarDiameter: value ? prev.originalRebarDiameter || "" : "",
      measuredRebarDiameter: value ? prev.measuredRebarDiameter || "" : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateReductionPercentage = () => {
    const originalDiameter = parseFloat(formData.originalRebarDiameter) || 1;
    const measuredDiameter = parseFloat(formData.measuredRebarDiameter) || 0;
    return (((originalDiameter - measuredDiameter) / originalDiameter) * 100).toFixed(2);
  };

  const determineStructuralImpact = (reduction) => {
    if (!reduction || reduction <= 0) return "No Reduction Detected";
    if (reduction > 20) return "High Impact - Immediate repair required.";
    if (reduction >= 10) return "Moderate Impact - Apply protective coatings and corrosion inhibitors.";
    return "Low Impact - No immediate action required.";
  };

  const generateRecommendation = (reduction) => {
    if (!reduction || reduction <= 0) return "✅ No Reduction Detected: No immediate action needed.";
    if (reduction > 20) return "❌ High Impact: Immediate repair required. Structural strengthening needed.";
    return "⚠️ Moderate Impact: Apply protective coatings and corrosion inhibitors.";
  };

  const reductionPercentage = calculateReductionPercentage();
  const structuralImpact = determineStructuralImpact(parseFloat(reductionPercentage));
  const recommendation = generateRecommendation(parseFloat(reductionPercentage));

  useEffect(() => {
    if (showFields && reductionPercentage) {
      setFormData((prev) => ({
        ...prev,
        rebar_diameter_test: {
          reduction_percentage: reductionPercentage,
          impact: structuralImpact,
          recommendation: recommendation,
        },
      }));
    }
  }, [reductionPercentage, structuralImpact, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Rebar Diameter Reduction Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="rebar_diameter_test" value="yes" checked={showFields} onChange={handleRadioChange} /> Yes
      <input type="radio" name="rebar_diameter_test" value="no" checked={!showFields} onChange={handleRadioChange} /> No

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

          <label>Upload Image:</label>
          <input type="file" name="rebarDiameterImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews?.rebarDiameterImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.rebarDiameterImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={recommendation} readOnly />
        </>
      )}
    </div>
  );
};

export default RebarDiameterReductionTest;
