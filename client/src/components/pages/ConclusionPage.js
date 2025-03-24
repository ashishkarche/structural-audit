import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/ConclusionPage.css";
import ToastNotification from "../../components/ToastNotification"; // Import Notification Component

const ConclusionPage = () => {
  const { auditId } = useParams();
  const navigate = useNavigate();

  // ✅ Check if already submitted
  const [isSubmitted, setIsSubmitted] = useState(localStorage.getItem(`conclusionSubmitted_${auditId}`) === "submitted");

  const [formData, setFormData] = useState({
    conclusion: "",
    recommendations: "",
    technicalComments: "",
    executiveEngineers: "",
    superintendingEngineers: "",
    chiefEngineers: "",
  });

  const [error, setError] = useState("");
  const [toast, setToast] = useState(null); // Toast notification state

  // ✅ Handle input change (disabled if already submitted)
  const handleChange = (e) => {
    if (isSubmitted) return;
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    const config = {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    };

    try {
      await axios.post(`https://structural-audit.vercel.app/api/conclusion/${auditId}`, formData, config);

      // ✅ Mark as submitted
      localStorage.setItem(`conclusionSubmitted_${auditId}`, "submitted");
      setIsSubmitted(true);

      setToast({ message: "Submission Successful!", type: "success" }); // Show success toast

      setTimeout(() => navigate(`/audit/${auditId}/details`), 2000); // Navigate after delay
    } catch (err) {
      setToast({ message: "Submission Failed!", type: "error" }); // Show error toast
    }
  };

  return (
    <div className="conclusion-page-container">
      <h2 className="conclusion-page-title">Conclusion & Recommendations</h2>
      {error && <p className="conclusion-error-message">{error}</p>}
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />} {/* Notification */}

      {isSubmitted ? (
        <p>Your conclusions and recommendations have been submitted. You can view the details below.</p>
      ) : (
        <form onSubmit={handleSubmit} className="conclusion-form">
          {/* Conclusion */}
          <div className="form-group">
            <label htmlFor="conclusion">Conclusion of Audit</label>
            <textarea
              id="conclusion"
              name="conclusion"
              value={formData.conclusion}
              onChange={handleChange}
              disabled={isSubmitted}
              required
            />
          </div>

          {/* Recommendations */}
          <div className="form-group">
            <label htmlFor="recommendations">Recommendations</label>
            <textarea
              id="recommendations"
              name="recommendations"
              value={formData.recommendations}
              onChange={handleChange}
              disabled={isSubmitted}
              required
            />
          </div>

          {/* Technical Comments on Distress */}
          <div className="form-group">
            <label htmlFor="technicalComments">Technical Comments on Nature of Distress</label>
            <textarea
              id="technicalComments"
              name="technicalComments"
              value={formData.technicalComments}
              onChange={handleChange}
              disabled={isSubmitted}
              required
            />
          </div>

          {/* Engineer Comments */}
          <div className="form-group">
            <label htmlFor="executiveEngineers">Executive Engineers</label>
            <input
              type="text"
              id="executiveEngineers"
              name="executiveEngineers"
              value={formData.executiveEngineers}
              onChange={handleChange}
              disabled={isSubmitted}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="superintendingEngineers">Superintending Engineers</label>
            <input
              type="text"
              id="superintendingEngineers"
              name="superintendingEngineers"
              value={formData.superintendingEngineers}
              onChange={handleChange}
              disabled={isSubmitted}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="chiefEngineers">Chief Engineers</label>
            <input
              type="text"
              id="chiefEngineers"
              name="chiefEngineers"
              value={formData.chiefEngineers}
              onChange={handleChange}
              disabled={isSubmitted}
              required
            />
          </div>

          {!isSubmitted && <button type="submit" className="conclusion-submit-btn">Save & Finish</button>}
        </form>
      )}
    </div>
  );
};

export default ConclusionPage;
