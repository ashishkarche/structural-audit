import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaEnvelope, FaLock, FaBuilding, FaGraduationCap, FaBriefcase, FaCalendar, FaEye, FaEyeSlash, FaInfoCircle } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../static/Register.css";

function Register() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    qualification: "",
    specialization: "",
    firmName: "",
    generalExperience: "",
    specializedExperience: "",
    employmentPeriod: "",
    email: "",
    password: "",
    termsAccepted: false,
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleNext = () => setStep((prevStep) => prevStep + 1);
  const handleBack = () => setStep((prevStep) => prevStep - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // ✅ Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Invalid email format.");
      return;
    }

    // ✅ Password Validation
    const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 8 characters, contain a number & a special character.");
      return;
    }

    try {
      await axios.post("https://your-api/register", formData);
      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <div className="register-page">
      {/* Left Section - Instructions */}
      <div className="register-instructions">
        <h3><FaInfoCircle /> Registration Guide</h3>
        <ul>
          <li>Fill in your **Basic Details** (Name, Qualification, Specialization).</li>
          <li>Provide your **Work Experience** (Firm Name, Years of Experience).</li>
          <li>Set up your **Account Details** (Email, Password, Accept Terms).</li>
          <li>Password must have **8+ characters, 1 number & 1 special character**.</li>
          <li>Click **Register** to complete the process.</li>
        </ul>
        <p>Already have an account? <span className="login-link" onClick={() => navigate("/")}>Login Here</span></p>
      </div>

      {/* Right Section - Registration Form */}
      <div className="register-container">
        <div className="register-card">
          <h2 className="register-title">Create an Account</h2>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}

          {/* Step Progress Indicator */}
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? "active" : ""}`}>1</div>
            <div className={`step ${step >= 2 ? "active" : ""}`}>2</div>
            <div className={`step ${step === 3 ? "active" : ""}`}>3</div>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Step 1: Basic Details */}
            {step === 1 && (
              <div className="form-group">
                <div className="input-group">
                  <FaUser className="input-icon" />
                  <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>

                <div className="input-group">
                  <FaGraduationCap className="input-icon" />
                  <input type="text" placeholder="Qualification" value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} required />
                </div>

                <div className="input-group">
                  <FaBriefcase className="input-icon" />
                  <input type="text" placeholder="Specialization" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} required />
                </div>
              </div>
            )}

            {/* Step 2: Work Experience */}
            {step === 2 && (
              <div className="form-group">
                <div className="input-group">
                  <FaBuilding className="input-icon" />
                  <input type="text" placeholder="Firm Name" value={formData.firmName} onChange={(e) => setFormData({ ...formData, firmName: e.target.value })} required />
                </div>

                <div className="input-group">
                  <FaCalendar className="input-icon" />
                  <input type="number" placeholder="General Experience (Years)" value={formData.generalExperience} onChange={(e) => setFormData({ ...formData, generalExperience: e.target.value })} required />
                </div>

                <div className="input-group">
                  <FaCalendar className="input-icon" />
                  <input type="number" placeholder="Specialized Experience (Years)" value={formData.specializedExperience} onChange={(e) => setFormData({ ...formData, specializedExperience: e.target.value })} required />
                </div>

                <div className="input-group">
                  <FaCalendar className="input-icon" />
                  <input type="text" placeholder="Employment Period (Years)" value={formData.employmentPeriod} onChange={(e) => setFormData({ ...formData, employmentPeriod: e.target.value })} required />
                </div>
              </div>
            )}

            {/* Step 3: Account Details */}
            {step === 3 && (
              <div className="form-group">
                <div className="input-group">
                  <FaEnvelope className="input-icon" />
                  <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>

                <div className="input-group">
                  <FaLock className="input-icon" />
                  <input type={showPassword ? "text" : "password"} placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                  <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                {/* Terms & Conditions */}
                <div className="terms-container">
                  <input type="checkbox" id="terms" checked={formData.termsAccepted} onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })} />
                  <label htmlFor="terms"><strong>I accept the Terms & Conditions</strong></label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="button-group">
              {step > 1 && <button type="button" className="back-btn" onClick={handleBack}>Back</button>}
              {step < 3 && <button type="button" className="next-btn" onClick={handleNext}>Next</button>}
              {step === 3 && <button type="submit" className="register-btn">Register</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
