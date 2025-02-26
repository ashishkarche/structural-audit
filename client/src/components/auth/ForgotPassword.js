import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaInfoCircle, FaArrowLeft } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../static/ForgetPassword.css";

function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // Step 1: Enter email, Step 2: Update password
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await axios.post("https://structural-audit.vercel.app/api/check-email", { email });
      if (response.data.exists) {
        setStep(2); // Move to password update step
        setMessage("Email verified! Enter your new password.");
      } else {
        setError("Email not registered.");
      }
    } catch (error) {
      setError("Error checking email. Try again.");
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // ✅ Password Validation
    const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError("Password must be at least 8 characters, include a number & special character.");
      return;
    }

    try {
      await axios.post("https://structural-audit.vercel.app/api/update-password", { email, newPassword });
      setMessage("Password updated successfully! Redirecting to login...");

      // ✅ Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      setError("Error updating password. Try again.");
    }
  };

  return (
    <div className="forget-password-page">
      {/* Left Section - Instructions */}
      <div className="forget-password-instructions">
        <h3><FaInfoCircle /> How to Reset Your Password?</h3>
        <ul>
          <li>Enter your **registered email** to verify your identity.</li>
          <li>If your email exists, you'll proceed to set a **new password**.</li>
          <li>Your new password must have **at least 8 characters**, including **1 number & 1 special character**.</li>
          <li>Once updated, you'll be redirected to the **Login Page**.</li>
        </ul>
        {/* 🔹 Back to Login Button */}
        <button className="back-to-login-btn" onClick={() => navigate("/")}>
          <FaArrowLeft /> Back to Login
        </button>
      </div>

      {/* Right Section - Form */}
      <div className="forget-password-container">
        <div className="forget-password-card">
          <h2 className="forget-password-title">Reset Password</h2>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}

          {step === 1 ? (
            <form onSubmit={handleEmailSubmit} className="forget-password-form">
              <div className="input-group">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="submit-btn">Verify Email</button>
            </form>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="forget-password-form">
              <div className="input-group">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              <button type="submit" className="submit-btn">Update Password</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgetPassword;
