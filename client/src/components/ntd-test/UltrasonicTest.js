import React, { useState, useEffect } from "react";

const UltrasonicTest = ({ formData, setFormData, handleImageChange, imagePreviews }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    const value = e.target.value;
    setShowFields(value === "yes");
    setFormData((prev) => ({
      ...prev,
      ultrasonic_test: value === "yes" ? "" : null, // ✅ If "no", set to null
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Determine Concrete Quality based on Pulse Velocity
  const determineConcreteQuality = (velocity) => {
    if (!velocity) return "";
    if (velocity > 4.5) return "Very Good";
    if (velocity >= 3.5) return "Good";
    if (velocity >= 3.0) return "Medium";
    if (velocity < 3.0 && velocity > 0) return "Poor";
    return "Very Poor";
  };

  // Generate Recommendations based on Concrete Quality
  const generateRecommendation = (velocity) => {
    if (!velocity) return "";

    if (velocity > 4.5) {
      return "✅ Concrete is of high quality, indicating dense, strong, and durable material. No immediate remedial actions required.";
    }
    if (velocity >= 3.5) {
      return "✔️ Concrete is of good quality and structurally sound. Minor surface treatments may be required.";
    }
    if (velocity >= 3.0) {
      return "⚠️ Concrete quality is medium, requiring further investigation. Core testing and detailed structural analysis may be necessary. Possible remedial measures include grouting, surface treatments, or strengthening.";
    }
    if (velocity < 3.0 && velocity > 0) {
      return "❌ Concrete is poor or defective and requires immediate attention. Structural integrity must be evaluated with core tests. Repair techniques like grouting, jacketing, or even reconstruction may be needed.";
    }
    return "🚨 Concrete is severely distressed. Emergency intervention required. Structural rehabilitation, load reduction, or reconstruction may be necessary.";
  };

  const pulseVelocity = parseFloat(formData.ultrasonicVelocity);
  const concreteQuality = determineConcreteQuality(pulseVelocity);
  const recommendation = generateRecommendation(pulseVelocity);

  // ✅ Store test result as a JSON string
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

  return (
    <div className="test-section">
      <h3>Ultrasonic Pulse Velocity Test</h3>

      <label>Perform Test?</label>
      <input type="radio" name="ultrasonicTest" value="yes" onChange={handleRadioChange} /> Yes
      <input type="radio" name="ultrasonicTest" value="no" onChange={handleRadioChange} /> No

      {showFields && (
        <>
          <label>Velocity (km/sec):</label>
          <input type="number" name="ultrasonicVelocity" step="0.1" value={formData.ultrasonicVelocity || ""} onChange={handleChange} />

          <label>Concrete Quality:</label>
          <input type="text" value={concreteQuality} readOnly />

          {/* ✅ Image Upload Section */}
          <label>Upload Image:</label>
          <input type="file" name="ultrasonicImage" accept="image/*" onChange={handleImageChange} />

          {imagePreviews.ultrasonicImage && (
            <div className="image-preview">
              <p>Uploaded Image:</p>
              <img src={imagePreviews.ultrasonicImage} alt="Uploaded Test" width="200px" />
            </div>
          )}

          {/* ✅ Recommendation Box */}
          {recommendation && (
            <div className="recommendation-box">
              <h4>Recommendation (As per IS 13311 Part-1:1992):</h4>
              <p>{recommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UltrasonicTest;
