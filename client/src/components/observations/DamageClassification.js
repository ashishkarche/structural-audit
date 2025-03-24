import React, { useEffect } from "react";

function DamageClassification({ classification, setClassification }) {
  const damageClasses = React.useMemo(() => [
    "Class 0 - Cosmetic",
    "Class 1 - Superficial",
    "Class 2 - Patch Repair",
    "Class 3 - Principal Repair",
    "Class 4 - Major Repair",
  ], []);

  // Ensure default selection when component loads
  useEffect(() => {
    if (!classification) {
      setClassification(damageClasses[0]); // Set default value
    }
  }, [classification, setClassification, damageClasses]);

  return (
    <div>
      <label>Damage Classification:</label>
      <select
        value={classification || damageClasses[0]}
        onChange={(e) => setClassification(e.target.value)}
      >
        {damageClasses.map((damageClass, index) => (
          <option key={index} value={damageClass}>
            {damageClass}
          </option>
        ))}
      </select>
    </div>
  );
}

export default DamageClassification;
