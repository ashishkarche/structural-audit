import React, { useState, useEffect } from "react";

const HalfCellPotentialTest = ({ formData, setFormData, handleImageChange, imageData, isSubmitted }) => {
  const [showFields, setShowFields] = useState(!!formData.half_cell_potential_test);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      half_cell_potential_test: value ? "yes" : "no",
      halfCellPotential: value ? prev.halfCellPotential || "" : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const determineCorrosionProbability = (potential) => {
    if (!potential || potential > -200) return "Low Risk (10%)";
    if (potential >= -350) return "Moderate Risk (50%)";
    return "High Risk (90%)";
  };

  const generateRecommendation = (potential) => {
    if (!potential || potential > -200) return "Low Risk: Apply corrosion inhibitors and protective coatings.";
    if (potential >= -350) return "Moderate Risk: Frequent inspections required, apply anti-corrosion coatings.";
    return "High Risk: Immediate corrosion control needed, electrochemical testing required.";
  };

  const halfCellPotential = parseFloat(formData.halfCellPotential) || 0;
  const corrosionProbability = determineCorrosionProbability(halfCellPotential);
  const recommendation = generateRecommendation(halfCellPotential);

  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        corrosion_probability: corrosionProbability,
        half_cell_recommendation: recommendation,
      }));
    }
  }, [halfCellPotential, corrosionProbability, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Half-Cell Potential Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="half_cell_potential_test" value="yes" checked={showFields} onChange={handleRadioChange} /> Yes
      <input type="radio" name="half_cell_potential_test" value="no" checked={!showFields} onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Potential (mV):</label>
          <input type="number" name="halfCellPotential" value={formData.halfCellPotential || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Corrosion Probability:</label>
          <input type="text" value={formData.corrosion_probability || ""} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="halfCellPotentialImage" accept="image/*" onChange={handleImageChange} disabled={isSubmitted} />

          {imageData?.halfCellPotentialImage && (
            <div className="image-preview">
              <img src={imageData.halfCellPotentialImage.preview} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={formData.half_cell_recommendation || ""} readOnly />
        </>
      )}
    </div>
  );
};

export default HalfCellPotentialTest;
