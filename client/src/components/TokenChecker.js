import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const TokenChecker = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get current route

  useEffect(() => {
    const checkTokenValidity = () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const decodedToken = jwtDecode(token);

          if (decodedToken.exp * 1000 < Date.now()) {
            // Token expired, logout and redirect to login
            localStorage.removeItem("token");
            navigate("/");
          } else if (location.pathname === "/") {
            // Token is valid, redirect logged-in user to dashboard
            navigate("/dashboard");
          }
        } catch (error) {
          console.error("Invalid token", error);
          localStorage.removeItem("token");
          navigate("/");
        }
      }
    };

    checkTokenValidity();
  }, [navigate, location]);

  return null; // No UI needed
};

export default TokenChecker;
