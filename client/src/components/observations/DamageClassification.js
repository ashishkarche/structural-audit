import React from "react";

function DamageClassification({ classification, setClassification }) {
  const damageClasses = [
    "Class 0 - Cosmetic",
    "Class 1 - Superficial",
    "Class 2 - Patch Repair",
    "Class 3 - Principal Repair",
    "Class 4 - Major Repair",
  ];

  return (
    <div>
      <label>Damage Classification:</label>
      <select value={classification} onChange={(e) => setClassification(e.target.value)}>
        {damageClasses.map((damageClass, index) => (
          <option key={index} value={damageClass}>{damageClass}</option>
        ))}
      </select>
    </div>
  );
}

export default DamageClassification;