import React, { useState, useEffect } from "react";

const HalfCellPotentialTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    const value = e.target.value;
    setShowFields(value === "yes");
    setFormData((prev) => ({
      ...prev,
      half_cell_potential_test: value === "yes" ? "" : null, // ✅ If "no", set to null
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChangeLocal = (e) => {
    handleImageChange(e); // ✅ Pass to parent handler
  };

  // Determine Corrosion Probability based on Half-Cell Potential (As per IS 15926:2018)
  const determineCorrosionProbability = (potential) => {
    if (!potential) return "";
    if (potential > -200) return "Low Risk (10%)";
    if (potential >= -350) return "Moderate Risk (50%)";
    return "High Risk (90%)";
  };

  // Generate Recommendations based on Corrosion Risk
  const generateRecommendation = (potential) => {
    if (!potential) return "";

    if (potential > -200) {
      return "✅ Low Risk: Immediate repairs such as rebar treatment and patch repairs. Apply corrosion inhibitors as per IS 9077. Use cathodic protection. Apply anti-corrosion coatings for reinforcement. Ensure proper waterproofing to prevent moisture ingress.";
    }
    if (potential >= -350) {
      return "⚠️ Moderate Risk: Conduct frequent inspections (every 6-12 months). Apply protective coatings (epoxy/polyurethane) and consider corrosion-resistant rebars.";
    }
    return "❌ High Risk: Immediate corrosion control required. Perform electrochemical testing and apply corrosion-resistant treatments.";
  };

  const halfCellPotential = parseFloat(formData.halfCellPotential);
  const corrosionProbability = determineCorrosionProbability(halfCellPotential);
  const recommendation = generateRecommendation(halfCellPotential);

  // ✅ Store test result as a JSON string
  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        half_cell_potential_test: JSON.stringify({
          potential_value: halfCellPotential || "N/A",
          corrosion_probability: corrosionProbability,
          recommendation: recommendation,
        }),
      }));
    }
  }, [halfCellPotential, corrosionProbability, recommendation, showFields]);

  return (
    <div className="test-section">
      <h3>Half-Cell Potential Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="half_cell_potential_test" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="half_cell_potential_test" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Potential (mV):</label>
          <input type="number" name="halfCellPotential" value={formData.halfCellPotential || ""} onChange={handleChange} />

          <label>Corrosion Probability:</label>
          <input type="text" value={corrosionProbability} readOnly />

          {/* ✅ Image Upload Section */}
          <label>Upload Image:</label>
          <input type="file" name="halfCellPotentialImage" accept="image/*" onChange={handleImageChangeLocal} />

          {imagePreviews.halfCellPotentialImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.halfCellPotentialImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          {/* ✅ Recommendation Box */}
          {recommendation && (
            <div className="recommendation-box">
              <h4>Recommendation (As per IS 15926:2018 & IS 9077):</h4>
              <p>{recommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HalfCellPotentialTest;
