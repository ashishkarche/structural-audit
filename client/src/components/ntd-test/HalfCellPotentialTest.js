import React, { useState, useEffect } from "react";

const HalfCellPotentialTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(formData.half_cell_potential_test !== null);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      half_cell_potential_test: value ? {} : null, // ✅ Reset test data when "No" is selected
      halfCellPotential: value ? prev.halfCellPotential || "" : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Compute Corrosion Probability
  const determineCorrosionProbability = (potential) => {
    if (!potential || potential > -200) return "Low Risk (10%)";
    if (potential >= -350) return "Moderate Risk (50%)";
    return "High Risk (90%)";
  };

  // ✅ Generate Recommendation
  const generateRecommendation = (potential) => {
    if (!potential || potential > -200)
      return "✅ Low Risk: Apply corrosion inhibitors, anti-corrosion coatings, and waterproofing.";
    if (potential >= -350)
      return "⚠️ Moderate Risk: Conduct frequent inspections. Use protective coatings and corrosion-resistant rebars.";
    return "❌ High Risk: Immediate corrosion control required. Perform electrochemical testing and apply corrosion-resistant treatments.";
  };

  // ✅ Memoized Computations
  const halfCellPotential = parseFloat(formData.halfCellPotential);
  const corrosionProbability = determineCorrosionProbability(halfCellPotential);
  const recommendation = generateRecommendation(halfCellPotential);

  // ✅ Update `formData` only when necessary
  useEffect(() => {
    if (showFields && halfCellPotential) {
      setFormData((prev) => ({
        ...prev,
        half_cell_potential_test: JSON.stringify({
          potential_value: formData.halfCellPotential || "N/A",
          corrosion_probability: corrosionProbability,
          recommendation: recommendation,
        }),
      }));
    }
  }, [halfCellPotential, corrosionProbability, recommendation, showFields, setFormData]);

  // ✅ Safely parse stored JSON data
  let testData = {};
  try {
    testData = JSON.parse(formData.half_cell_potential_test || "{}");
  } catch (error) {
    testData = {};
  }

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
          <input type="text" value={testData.corrosion_probability || ""} readOnly />

          {/* ✅ Image Upload Section */}
          <label>Upload Image:</label>
          <input type="file" name="halfCellPotentialImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews?.halfCellPotentialImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.halfCellPotentialImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          {/* ✅ Recommendation Box */}
          <label>Recommendation:</label>
          <input type="text" value={testData.recommendation || ""} readOnly />
        </>
      )}
    </div>
  );
};

export default HalfCellPotentialTest;
