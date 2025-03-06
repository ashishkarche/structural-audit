import React, { useState, useEffect } from "react";

const HalfCellPotentialTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(!!formData.half_cell_potential_test);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      half_cell_potential_test: value ? {} : null,
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
    if (!potential || potential > -200)
      return "Low Risk: Apply corrosion inhibitors, anti-corrosion coatings, and waterproofing.";
    if (potential >= -350)
      return "Moderate Risk: Conduct frequent inspections. Use protective coatings and corrosion-resistant rebars.";
    return "High Risk: Immediate corrosion control required. Perform electrochemical testing and apply corrosion-resistant treatments.";
  };

  const halfCellPotential = parseFloat(formData.halfCellPotential);
  const corrosionProbability = determineCorrosionProbability(halfCellPotential);
  const recommendation = generateRecommendation(halfCellPotential);

  useEffect(() => {
    if (showFields && halfCellPotential) {
      setFormData((prev) => ({
        ...prev,
        half_cell_potential_test: {
          potential_value: formData.halfCellPotential || "N/A",
          corrosion_probability: corrosionProbability,
          recommendation: recommendation,
        },
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
          <input type="number" name="halfCellPotential" value={formData.halfCellPotential || ""} onChange={handleChange} />

          <label>Corrosion Probability:</label>
          <input type="text" value={corrosionProbability} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="halfCellPotentialImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews?.halfCellPotentialImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.halfCellPotentialImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={recommendation} readOnly />
        </>
      )}
    </div>
  );
};

export default HalfCellPotentialTest;
