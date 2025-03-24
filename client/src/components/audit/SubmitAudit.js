import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/SubmitAudit.css";
import ToastNotification from "../../components/ToastNotification"; // Import Notification Component

function SubmitAudit() {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    yearOfConstruction: "",
    dateOfAudit: "",
    area: "",
    structureType: "",
    cementType: "",
    otherCementType: "",
    steelType: "",
    otherSteelType: "",
    numberOfStories: "",
    designedUse: "",
    presentUse: "",
    changesInBuilding: "",
    distressYear: "",
    distressNature: "",
  });

  const [error, setError] = useState("");
  const [toast, setToast] = useState(null); // Toast notification state

  const navigate = useNavigate();

  // Handle input changes dynamically
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "cementType" && value !== "Other" ? { otherCementType: "" } : {}),
      ...(name === "steelType" && value !== "Other" ? { otherSteelType: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };

    const formattedData = {
      ...formData,
      dateOfAudit: formData.dateOfAudit ? new Date(formData.dateOfAudit).toISOString().split("T")[0] : "",
      distressYear: formData.distressYear ? parseInt(formData.distressYear, 10) : null,
    };

    try {
      const response = await axios.post("https://structural-audit.vercel.app/submit-audit", formattedData, config);
      setToast({ message: "Submission Successful!", type: "success" }); // Show success toast

      setTimeout(() => navigate(`/audit/${response.data.auditId}/upload-drawings`), 2000);
    } catch (err) {
      setToast({ message: "Submission Failed!", type: "error" }); // Show error toast
      setError(err.response?.data?.message || "Failed to submit audit. Please try again.");
    }
  };

  // Function to render common input fields
  const renderInput = (key, label, type = "text") => (
    <div className="audit-form-group" key={key}>
      <label className="audit-form-label">{label}</label>
      <input
        className="audit-form-input"
        type={type}
        name={key}
        placeholder={`Enter ${label}`}
        value={formData[key]}
        onChange={handleChange}
        required
      />
    </div>
  );

  return (
    <div className="audit-form-container">
      <h2 className="audit-form-title">Submit New Audit</h2>
      {error && <p className="audit-form-error">{error}</p>}
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />} {/* Notification */}

      <form onSubmit={handleSubmit} className="audit-form-box">
        <div className="audit-form-grid">
          {[
            { key: "name", label: "Project Name" },
            { key: "location", label: "Location" },
            { key: "yearOfConstruction", label: "Year of Construction", type: "number" },
            { key: "dateOfAudit", label: "Date of Audit", type: "date" },
            { key: "area", label: "Area of Building (sq.ft.)" },
            { key: "structureType", label: "Type of Structure" },
            { key: "numberOfStories", label: "Number of Stories", type: "number" },
            { key: "designedUse", label: "Designed Use" },
            { key: "presentUse", label: "Present Use" },
            { key: "changesInBuilding", label: "Any Other Changes in Building" },
            { key: "distressYear", label: "Year of First Distress Noticed", type: "number" },
            { key: "distressNature", label: "Nature of Distress Noticed" },
          ].map(({ key, label, type }) => renderInput(key, label, type))}

          {/* Cement Type Selection */}
          <div className="audit-form-group">
            <label className="audit-form-label">Type of Cement Used</label>
            <select
              className="audit-form-input"
              name="cementType"
              value={formData.cementType}
              onChange={handleChange}
              required
            >
              <option value="">Select Cement Type</option>
              <option value="OPC">OPC</option>
              <option value="PPC">PPC</option>
              <option value="SRC">SRC</option>
              <option value="Other">Other</option>
            </select>
            {formData.cementType === "Other" && (
              <input
                className="audit-form-input"
                type="text"
                name="otherCementType"
                placeholder="Enter other cement type"
                value={formData.otherCementType}
                onChange={handleChange}
                required
              />
            )}
          </div>

          {/* Steel Type Selection */}
          <div className="audit-form-group">
            <label className="audit-form-label">Type of Steel Reinforcement</label>
            <select
              className="audit-form-input"
              name="steelType"
              value={formData.steelType}
              onChange={handleChange}
              required
            >
              <option value="">Select Steel Type</option>
              <option value="Mild Steel">Mild Steel</option>
              <option value="Cold Twisted Steel">Cold Twisted Steel</option>
              <option value="TMT">TMT</option>
              <option value="Other">Other</option>
            </select>
            {formData.steelType === "Other" && (
              <input
                className="audit-form-input"
                type="text"
                name="otherSteelType"
                placeholder="Enter other steel type"
                value={formData.otherSteelType}
                onChange={handleChange}
                required
              />
            )}
          </div>
        </div>

        <div className="audit-form-group submit-btn-container">
          <button type="submit" className="audit-submit-btn">Save & Next</button>
        </div>
      </form>
    </div>
  );
}

export default SubmitAudit;
