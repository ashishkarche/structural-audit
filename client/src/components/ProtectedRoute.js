// components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";

const isTokenValid = (token) => {
  try {
    const decoded = jwtDecode(token);
    // decoded.exp is in seconds, so multiply by 1000 to compare with Date.now()
    return decoded.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token || !isTokenValid(token)) {
    // If the token is missing or expired, remove it and alert the user.
    localStorage.removeItem("token");
    alert("Your session has expired. Please log in again.");
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
