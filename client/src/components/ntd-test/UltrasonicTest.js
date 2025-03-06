import React, { useState, useEffect } from "react";

const UltrasonicTest = ({ formData, setFormData, handleImageChange, imageData, isSubmitted }) => {
  const [showFields, setShowFields] = useState(!!formData.ultrasonic_pulse_velocity);

  const handleRadioChange = (e) => {
    const value = e.target.value === "yes";
    setShowFields(value);

    setFormData((prev) => ({
      ...prev,
      ultrasonic_pulse_velocity: value ? prev.ultrasonic_pulse_velocity || "" : null,
      ultrasonic_concrete_quality: value ? prev.ultrasonic_concrete_quality || "" : null,
      ultrasonic_recommendation: value ? prev.ultrasonic_recommendation || "" : null,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Determine Concrete Quality
  const determineConcreteQuality = (velocity) => {
    if (!velocity) return "";
    if (velocity > 4.5) return "Very Good";
    if (velocity >= 3.5) return "Good";
    if (velocity >= 3.0) return "Medium";
    return velocity > 0 ? "Poor" : "Very Poor";
  };

  // ✅ Generate Recommendation
  const generateRecommendation = (velocity) => {
    if (!velocity) return "";
    if (velocity > 4.5) return "✅ Low Risk: No intervention required.";
    if (velocity >= 3.5) return "✔️ Moderate Risk: Surface repairs and monitoring required.";
    if (velocity >= 3.0) return "⚠️ High Risk: Further structural assessment needed.";
    return "❌ Severe Risk: Immediate retrofitting and repairs required.";
  };

  // ✅ Auto-calculate values when `ultrasonic_pulse_velocity` changes
  useEffect(() => {
    if (showFields) {
      const pulseVelocity = parseFloat(formData.ultrasonic_pulse_velocity) || 0;
      const concreteQuality = determineConcreteQuality(pulseVelocity);
      const recommendation = generateRecommendation(pulseVelocity);

      setFormData((prev) => ({
        ...prev,
        ultrasonic_concrete_quality: concreteQuality,
        ultrasonic_recommendation: recommendation,
      }));
    }
  }, [formData.ultrasonic_pulse_velocity, showFields, setFormData]);

  return (
    <div className="test-section">
      <h3>Ultrasonic Pulse Velocity Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="ultrasonic_test" value="yes" checked={showFields} onChange={handleRadioChange} disabled={isSubmitted} /> Yes
      <input type="radio" name="ultrasonic_test" value="no" checked={!showFields} onChange={handleRadioChange} disabled={isSubmitted} /> No

      {showFields && (
        <>
          <label>Velocity (km/sec):</label>
          <input type="number" name="ultrasonic_pulse_velocity" step="0.1" value={formData.ultrasonic_pulse_velocity || ""} onChange={handleChange} disabled={isSubmitted} />

          <label>Concrete Quality:</label>
          <input type="text" name="ultrasonic_concrete_quality" value={formData.ultrasonic_concrete_quality || ""} readOnly />

          <label>Upload Image:</label>
          <input type="file" name="ultrasonicImage" accept="image/*" onChange={handleImageChange} disabled={isSubmitted} />

          {imageData?.ultrasonicImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imageData.ultrasonicImage.preview} alt="Uploaded Test" width="200px" />
            </div>
          )}

          <label>Recommendation:</label>
          <input type="text" name="ultrasonic_recommendation" value={formData.ultrasonic_recommendation || ""} readOnly />
        </>
      )}
    </div>
  );
};

export default UltrasonicTest;
