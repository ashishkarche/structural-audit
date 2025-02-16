import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaEnvelope, FaLock, FaBuilding, FaGraduationCap, FaBriefcase, FaCalendar } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../static/Register.css";

function Register() {
  const [step, setStep] = useState(1); // Step tracker
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
  const navigate = useNavigate();

  const handleNext = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("https://structural-audit.vercel.app/register", formData);
      navigate("/");
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">Create an Account</h2>
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
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <FaGraduationCap className="input-icon" />
                <input
                  type="text"
                  placeholder="Qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <FaBriefcase className="input-icon" />
                <input
                  type="text"
                  placeholder="Specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Work Experience */}
          {step === 2 && (
            <div className="form-group">
              <div className="input-group">
                <FaBuilding className="input-icon" />
                <input
                  type="text"
                  placeholder="Firm Name"
                  value={formData.firmName}
                  onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <FaCalendar className="input-icon" />
                <input
                  type="number"
                  placeholder="General Experience (Years)"
                  value={formData.generalExperience}
                  onChange={(e) => setFormData({ ...formData, generalExperience: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <FaCalendar className="input-icon" />
                <input
                  type="number"
                  placeholder="Specialized Experience (Years)"
                  value={formData.specializedExperience}
                  onChange={(e) => setFormData({ ...formData, specializedExperience: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <FaCalendar className="input-icon" />
                <input
                  type="text"
                  placeholder="Employment Period (Years)"
                  value={formData.employmentPeriod}
                  onChange={(e) => setFormData({ ...formData, employmentPeriod: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Account Details */}
          {step === 3 && (

            <div className="form-group">
              <div className="input-group">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>


              <div className="input-group">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="certificate-container">
                <p className="certificate-text">
                  The information furnished above is true to my knowledge and belief. I am aware that any mis-information or its concealment, which forms the basis of pre-qualification, is liable for any action against the firm, which could include termination of the agreement and/or blacklisting.
                </p>
              </div>

              {/* ✅ Terms & Conditions Checkbox */}
              <div className="terms-container">
                <input type="checkbox" id="terms" checked={formData.termsAccepted} onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })} />
                <label htmlFor="terms">
                  <strong>I accept the above Terms & Conditions</strong>
                </label>
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
        <p className="login-redirect">
          Already have an account? <span className="login-link" onClick={() => navigate("/")}>Login</span>
        </p>
      </div>
    </div>
  );
}

export default Register;
