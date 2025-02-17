import React from "react";
import "../static/SkeletonLoader.css"; // Make sure to add CSS for styling

const SkeletonLoader = () => {
  return (
    <div className="skeleton-loader">
      <div className="skeleton-header"></div>
      <div className="skeleton-card"></div>
      <div className="skeleton-card"></div>
      <div className="skeleton-table">
        <div className="skeleton-row"></div>
        <div className="skeleton-row"></div>
        <div className="skeleton-row"></div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
