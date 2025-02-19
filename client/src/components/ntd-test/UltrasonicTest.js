import React, { useState } from "react";

const UltrasonicTest = ({ formData, setFormData }) => {
  const [showFields, setShowFields] = useState(false);

  const handleRadioChange = (e) => {
    setShowFields(e.target.value === "yes");
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
    return "Poor";
  };

  const concreteQuality = determineConcreteQuality(parseFloat(formData.ultrasonicVelocity));

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
        </>
      )}
    </div>
  );
};

export default UltrasonicTest;
