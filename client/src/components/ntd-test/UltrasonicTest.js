import React, { useState, useEffect } from "react";

const UltrasonicTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(formData.ultrasonic_test !== null);

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

  // ✅ Determine Concrete Quality based on Pulse Velocity
  const determineConcreteQuality = (velocity) => {
    if (!velocity) return "";
    if (velocity > 4.5) return "Very Good";
    if (velocity >= 3.5) return "Good";
    if (velocity >= 3.0) return "Medium";
    return velocity > 0 ? "Poor" : "Very Poor";
  };

  // ✅ Generate Recommendations based on Concrete Quality
  const generateRecommendation = (velocity) => {
    if (!velocity) return "";

    return velocity > 4.5
      ? "✅ Low Risk: Concrete is of high quality, indicating dense, strong, and durable material. No immediate remedial actions required."
      : velocity >= 3.5
      ? "✔️ Moderate Risk: Concrete is of good quality and structurally sound. Minor surface treatments may be required."
      : velocity >= 3.0
      ? "⚠️ High Risk: Concrete quality is medium, requiring further investigation. Core testing and detailed structural analysis may be necessary. Possible remedial measures include grouting, surface treatments, or strengthening."
      : "❌ Severe Risk: Concrete is poor or defective and requires immediate attention. Structural integrity must be evaluated with core tests. Repair techniques like grouting, jacketing, or even reconstruction may be needed.";
  };

  // ✅ Memoized Computations
  const pulseVelocity = parseFloat(formData.ultrasonicVelocity) || 0;
  const concreteQuality = determineConcreteQuality(pulseVelocity);
  const recommendation = generateRecommendation(pulseVelocity);

  // ✅ Update formData only when necessary
  useEffect(() => {
    if (showFields) {
      setFormData((prev) => ({
        ...prev,
        ultrasonic_test: JSON.stringify({
          pulse_velocity: formData.ultrasonicVelocity || "N/A",
          concrete_quality: concreteQuality,
          recommendation: recommendation,
        }),
      }));
    }
  }, [pulseVelocity, concreteQuality, recommendation, showFields, setFormData]);

  // ✅ Safely parse stored JSON data
  let testData = {};
  try {
    testData = JSON.parse(formData.ultrasonic_test || "{}");
  } catch (error) {
    testData = {};
  }

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
          <input type="text" value={testData.concrete_quality || ""} readOnly />

          {/* ✅ Image Upload Section */}
          <label>Upload Image:</label>
          <input type="file" name="ultrasonicImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews?.ultrasonicImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.ultrasonicImage} alt="Uploaded Test" width="200px" />
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

export default UltrasonicTest;
