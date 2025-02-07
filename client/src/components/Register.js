import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaEnvelope, FaLock, FaBuilding, FaGraduationCap, FaBriefcase, FaCalendar } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../static/Register.css";

function Register() {
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
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("http://localhost:5000/register", formData);
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

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-grid">
            {/* Left Column */}
            <div className="form-column">
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
            </div>

            {/* Right Column */}
            <div className="form-column">
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
                  type="number"
                  placeholder="Employment Period (Years)"
                  value={formData.employmentPeriod}
                  onChange={(e) => setFormData({ ...formData, employmentPeriod: e.target.value })}
                  required
                />
              </div>

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
            </div>
          </div>

          <button type="submit" className="register-btn">Register</button>
        </form>

        <p className="login-link">
          Already have an account? <a href="/">Log in</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
