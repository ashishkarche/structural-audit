import React from "react";
import { Link } from "react-router-dom";
import "../static/NotFound.css";

function NotFound() {
  return (
    <div className="not-found-container">
      <h1>404</h1>
      <p>Oops! The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn btn-primary">Go Back to Dashboard</Link>
    </div>
  );
}

export default NotFound;
