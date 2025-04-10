import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../static/EditProfile.css";
import { FaEdit, FaSave } from "react-icons/fa";

function EditProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    qualification: "",
    specialization: "",
    firm_name: "",  // Changed to match DB
    general_experience: 0, // Changed to match DB
    specialized_experience: 0, // Changed to match DB
    employment_period: 0, // Changed to match DB
    email: "",
  });
  

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("https://your-api/api/auditors/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.data) {
        setFormData({
          name: response.data.name || "",
          qualification: response.data.qualification || "",
          specialization: response.data.specialization || "",
          firm_name: response.data.firm_name || "",  // Fixed field name
          general_experience: response.data.general_experience || 0,
          specialized_experience: response.data.specialized_experience || 0,
          employment_period: response.data.employment_period || 0,
          email: response.data.email || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile.");
    }
  };
  
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setSuccess("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };

      const response = await axios.put("https://your-api/api/auditors/me", formData, config);

      setSuccess(response.data.message);
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-card">
        <div className="edit-profile-header">
          <h1>Profile</h1>
          {!isEditing && (
            <button className="edit-btn" onClick={handleEditClick}>
              <FaEdit /> Edit
            </button>
          )}
        </div>

        {error && <p className="text-danger text-center">{error}</p>}
        {success && <p className="text-success text-center">{success}</p>}

        <form onSubmit={handleSubmit} className="profile-form">
          {Object.keys(formData).map((key) => (
            <div className="form-group" key={key}>
              <label>{key.replace(/([A-Z])/g, " $1").trim()}</label>
              <input
                type={key === "email" ? "email" : key.includes("Experience") || key.includes("Period") ? "number" : "text"}
                name={key}
                value={formData[key]}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>
          ))}
          {isEditing && (
            <button type="submit" className="save-btn">
              <FaSave /> Save Changes
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
