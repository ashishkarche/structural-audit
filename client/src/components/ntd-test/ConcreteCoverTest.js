import React, { useState, useEffect } from "react";

const ConcreteCoverTest = ({ formData, setFormData, handleImageChange, imageData, isSubmitted }) => {
  const [showFields, setShowFields] = useState(!!formData.concrete_cover_test);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      concrete_cover_test: value ? "yes" : "no",
      concreteCoverRequired: value ? prev.concreteCoverRequired || "" : "",
      concreteCoverMeasured: value ? prev.concreteCoverMeasured || "" : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Compute Cover Deficiency
  const computeCoverDeficiency = () => {
    const requiredCover = parseFloat(formData.concreteCoverRequired) || 0;
    const measuredCover = parseFloat(formData.concreteCoverMeasured) || 0;
    return (requiredCover - measuredCover).toFixed(2);
  };

  // ✅ Determine Structural Risk
  const determineStructuralRisk = (deficiency) => {
    if (!deficiency || deficiency <= 0) return "Adequate Cover";
    if (deficiency > 10) return "Severe Cover Deficiency";
    if (deficiency >= 5) return "Moderate Cover Deficiency";
    return "Minor Cover Deficiency";
  };

  // ✅ Generate Recommendation
  const generateRecommendation = (deficiency) => {
    if (!deficiency || deficiency <= 0) {
      return "Adequate Cover: Continue regular structural monitoring and maintenance.";
    }
    if (deficiency > 10) {
      return "Severe Cover Deficiency: Immediate action required. Apply protective coatings (IS 13620), use corrosion inhibitors (IS 9077), repair using micro-concrete/polymer-modified mortar (IS 13935). Structural strengthening may be required.";
    }
    if (deficiency >= 5) {
      return "Moderate Cover Deficiency: Apply surface protection coatings, improve waterproofing (IS 2645), and conduct periodic inspections.";
    }
    return "Minor Cover Deficiency: No immediate action needed, but monitor regularly. Ensure proper curing and maintenance practices.";
  };

  // ✅ Memoized Computations
  const coverDeficiency = computeCoverDeficiency();
  const structuralRisk = determineStructuralRisk(parseFloat(coverDeficiency));
  const recommendation = generateRecommendation(parseFloat(coverDeficiency));

  // ✅ Update formData only when necessary
  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        concrete_cover_deficiency: coverDeficiency,
        concrete_cover_structural_risk: structuralRisk,
        concrete_cover_recommendation: recommendation,
      }));
    }
  }, [coverDeficiency, structuralRisk, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Concrete Cover Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="concrete_cover_test" value="yes" checked={showFields} onChange={handleRadioChange} disabled={isSubmitted} /> Yes
      <input type="radio" name="concrete_cover_test" value="no" checked={!showFields} onChange={handleRadioChange} disabled={isSubmitted} /> No

      {showFields && (
        <>
          <label>Required Cover (mm):</label>
          <input type="number" name="concreteCoverRequired" value={formData.concreteCoverRequired || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Measured Cover (mm):</label>
          <input type="number" name="concreteCoverMeasured" value={formData.concreteCoverMeasured || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Cover Deficiency (mm):</label>
          <input type="number" value={formData.concrete_cover_deficiency || ""} readOnly />

          <label>Structural Risk:</label>
          <input type="text" value={formData.concrete_cover_structural_risk || ""} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="concreteCoverImage" accept="image/*" onChange={handleImageChange} disabled={isSubmitted} />

          {imageData?.concreteCoverImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imageData.concreteCoverImage.preview} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={formData.concrete_cover_recommendation || ""} readOnly />
        </>
      )}
    </div>
  );
};

export default ConcreteCoverTest;
