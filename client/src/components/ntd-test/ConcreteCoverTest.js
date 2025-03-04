import React, { useState, useEffect } from "react";

const ConcreteCoverTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(formData.concrete_cover_test !== null);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      concrete_cover_test: value ? {} : null,
      concreteCoverRequired: value ? prev.concreteCoverRequired || "" : "",
      concreteCoverMeasured: value ? prev.concreteCoverMeasured || "" : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const computeCoverDeficiency = () => {
    const requiredCover = parseFloat(formData.concreteCoverRequired) || 0;
    const measuredCover = parseFloat(formData.concreteCoverMeasured) || 0;
    return (requiredCover - measuredCover).toFixed(2);
  };

  const determineStructuralRisk = (deficiency) => {
    if (!deficiency || deficiency <= 0) return "Adequate Cover";
    if (deficiency > 10) return "Severe Cover Deficiency";
    if (deficiency >= 5) return "Moderate Cover Deficiency";
    return "Minor Cover Deficiency";
  };

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

  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        concrete_cover_test: {
          required_cover: formData.concreteCoverRequired || "N/A",
          measured_cover: formData.concreteCoverMeasured || "N/A",
          cover_deficiency: coverDeficiency,
          structural_risk: structuralRisk,
          recommendation: recommendation,
        },
      }));
    }
  }, [coverDeficiency, structuralRisk, formData.concreteCoverRequired, formData.concreteCoverMeasured, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Concrete Cover Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="concrete_cover_test" value="yes" checked={showFields} onChange={handleRadioChange} /> Yes
      <input type="radio" name="concrete_cover_test" value="no" checked={!showFields} onChange={handleRadioChange} /> No

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

          <label>Upload Image:</label>
          <input type="file" name="concreteCoverImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews?.concreteCoverImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.concreteCoverImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={recommendation} readOnly />
        </>
      )}
    </div>
  );
};

export default ConcreteCoverTest;
