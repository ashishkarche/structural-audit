import React, { useEffect, useState } from "react";
import "../../static/Loader.css";

function Loader({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide loader after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete(); // Notify parent to remove loader
    }, 4000);

    return () => clearTimeout(timer); // Cleanup timeout on unmount
  }, [onComplete]);

  return isVisible ? (
    <div className="loader-container">
      <div className="ring">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  ) : null;
}

export default Loader;
