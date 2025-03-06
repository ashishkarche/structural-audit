import React, { useState, useEffect } from "react";

const UltrasonicTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(!!formData.ultrasonic_test);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);
    
    setFormData((prev) => ({
      ...prev,
      ultrasonic_test: value ? {} : null,
      ultrasonicVelocity: value ? prev.ultrasonicVelocity || "" : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const determineConcreteQuality = (velocity) => {
    if (!velocity) return "";
    if (velocity > 4.5) return "Very Good";
    if (velocity >= 3.5) return "Good";
    if (velocity >= 3.0) return "Medium";
    return velocity > 0 ? "Poor" : "Very Poor";
  };

  const generateRecommendation = (velocity) => {
    if (!velocity) return "";
    if (velocity > 4.5) return "Low Risk: Concrete is of high quality. No immediate remedial actions required.";
    if (velocity >= 3.5) return "Moderate Risk: Concrete is good. Minor surface treatments may be needed.";
    if (velocity >= 3.0) return "High Risk: Medium quality. Further testing and possible remedial actions required.";
    return "Severe Risk: Poor quality. Immediate attention needed, including possible structural repairs.";
  };

  const pulseVelocity = parseFloat(formData.ultrasonicVelocity) || 0;
  const concreteQuality = determineConcreteQuality(pulseVelocity);
  const recommendation = generateRecommendation(pulseVelocity);

  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        ultrasonic_test: {
          pulse_velocity: formData.ultrasonicVelocity || "N/A",
          concrete_quality: concreteQuality,
          recommendation: recommendation,
        },
      }));
    }
  }, [pulseVelocity, concreteQuality, recommendation, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Ultrasonic Pulse Velocity Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="ultrasonic_test" value="yes" checked={showFields} onChange={handleRadioChange} /> Yes
      <input type="radio" name="ultrasonic_test" value="no" checked={!showFields} onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Velocity (km/sec):</label>
          <input type="number" name="ultrasonicVelocity" step="0.1" value={formData.ultrasonicVelocity || ""} onChange={handleChange} />

          <label>Concrete Quality:</label>
          <input type="text" value={concreteQuality} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="ultrasonicImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews?.ultrasonicImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.ultrasonicImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" value={recommendation} readOnly />
        </>
      )}
    </div>
  );
};

export default UltrasonicTest;
