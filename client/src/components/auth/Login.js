import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaInfoCircle } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../static/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Check if Email is Registered
    try {
      const emailCheck = await axios.post("https://structural-audit.vercel.app/api/check-email", { email });

      if (!emailCheck.data.exists) {
        setError("Account not registered. Please Register first.");
        return;
      }
    } catch (err) {
      setError("Error verifying account. Please try again.");
      return;
    }

    // ✅ Password Validation
    const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Password must be at least 8 characters long & contain a number and special character.");
      return;
    }

    // ✅ Attempt Login
    try {
      const response = await axios.post("https://structural-audit.vercel.app/login", { email, password });
      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="login-page">
      {/* Left Section - Login Form */}
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">Auditor Login</h2>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <div className="forgot-password">
              <button type="button" className="forgot-password-btn" onClick={handleForgotPassword}>
                Forgot Password?
              </button>
            </div>
            <button type="submit" className="login-btn">Login</button>
          </form>
          <p className="register-link">
            New User? <a href="/register">Register Here</a>
          </p>
        </div>
      </div>

      {/* Right Section - Instructions */}
      <div className="login-instructions">
        <h3><FaInfoCircle /> How to Login?</h3>
        <ul>
          <li>Use your **registered email** and **password** to log in.</li>
          <li>Your **password** must have at least **8 characters**, **1 number**, and **1 special character**.</li>
          <li>If you forgot your password, click **"Forgot Password?"** on the login page.</li>
          <li>Need help? Contact **support@auditplatform.com**.</li>
        </ul>
      </div>
    </div>
  );
}

export default Login;
