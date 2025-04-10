import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/StructuralChangesPage.css";
import ToastNotification from "../../components/ToastNotification"; // Import Notification Component

function StructuralChangesPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();

  // ✅ Track if form is already submitted
  const [isSubmitted, setIsSubmitted] = useState(localStorage.getItem(`structuralChanges_${auditId}`) === "submitted");

  const [formData, setFormData] = useState({
    briefBackgroundHistory: "No",
    briefHistoryDetails: "",
    structuralChanges: "No",
    dateOfChange: "",
    changeDetails: "",
    previousInvestigation: "No",
    investigationFile: null,
    conclusionFromPreviousReport: "",
    scopeOfWork: "",
    purposeOfInvestigation: "",
  });

  const [error, setError] = useState("");
  const [toast, setToast] = useState(null); // Toast notification state

  const [uploadedPDF, setUploadedPDF] = useState(null); // ✅ Store the uploaded PDF

  const handleChange = (e) => {
    if (isSubmitted) return; // Prevent changes if already submitted
    const { name, value, type, files } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    };

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    try {
      await axios.post(
        `https://your-api/api/structural-changes/${auditId}`,
        formDataToSend,
        config
      );

      // ✅ Mark form as submitted
      localStorage.setItem(`structuralChanges_${auditId}`, "submitted");
      setIsSubmitted(true);

      setToast({ message: "Submission Successful!", type: "success" }); // Show success toast

      setTimeout(() => navigate(`/audit/${auditId}/observations`), 2000);
    } catch (err) {
      setToast({ message: "Submission Failed!", type: "error" }); // Show error toast
    }
  };

  return (
    <div className="structural-changes-page-container">
      <h2 className="structural-changes-page-title">Structural Changes</h2>

      {error && <p className="structural-changes-error-message">{error}</p>}
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />} {/* Notification */}

      {isSubmitted ? (
        <p>Your data has already been submitted. You can view the details below.</p>
      ) : (
        <form onSubmit={handleSubmit} className="structural-changes-form">
          {/* Brief Background History */}
          <div className="form-group">
            <label>Brief Background History?</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="briefBackgroundHistory"
                  value="Yes"
                  checked={formData.briefBackgroundHistory === "Yes"}
                  onChange={handleChange}
                  disabled={isSubmitted}
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="briefBackgroundHistory"
                  value="No"
                  checked={formData.briefBackgroundHistory === "No"}
                  onChange={handleChange}
                  disabled={isSubmitted}
                />
                No
              </label>
            </div>
          </div>

          {formData.briefBackgroundHistory === "Yes" && (
            <>
              <div className="form-group">
                <label>Details of Brief Background History</label>
                <textarea
                  name="briefHistoryDetails"
                  value={formData.briefHistoryDetails}
                  onChange={handleChange}
                  required
                  disabled={isSubmitted}
                />
              </div>

              {/* Structural Changes */}
              <div className="form-group">
                <label>Structural Changes Made in the Past?</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="structuralChanges"
                      value="Yes"
                      checked={formData.structuralChanges === "Yes"}
                      onChange={handleChange}
                      disabled={isSubmitted}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="structuralChanges"
                      value="No"
                      checked={formData.structuralChanges === "No"}
                      onChange={handleChange}
                      disabled={isSubmitted}
                    />
                    No
                  </label>
                </div>
              </div>

              {formData.structuralChanges === "Yes" && !isSubmitted && (
                <>
                  <div className="form-group">
                    <label>Date of Previous Structural Changes</label>
                    <input
                      type="date"
                      name="dateOfChange"
                      value={formData.dateOfChange}
                      onChange={handleChange}
                      required
                      disabled={isSubmitted}
                    />
                  </div>

                  <div className="form-group">
                    <label>Details of Changes Carried Out</label>
                    <textarea
                      name="changeDetails"
                      value={formData.changeDetails}
                      onChange={handleChange}
                      required
                      disabled={isSubmitted}
                    />
                  </div>
                </>
              )}

              {/* Previous Investigations */}
              <div className="form-group">
                <label>Any Previous Investigation Done?</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="previousInvestigation"
                      value="Yes"
                      checked={formData.previousInvestigation === "Yes"}
                      onChange={handleChange}
                      disabled={isSubmitted}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="previousInvestigation"
                      value="No"
                      checked={formData.previousInvestigation === "No"}
                      onChange={handleChange}
                      disabled={isSubmitted}
                    />
                    No
                  </label>
                </div>
              </div>

              {formData.previousInvestigation === "Yes" && !isSubmitted && (
                <div className="form-group">
                  <label>Upload Investigation Report (PDF)</label>
                  <input
                    type="file"
                    name="investigationFile"
                    accept="application/pdf"
                    onChange={handleChange}
                    disabled={isSubmitted}
                  />
                </div>
              )}

              {/* 🔹 Display Previously Uploaded Investigation Report */}
              {uploadedPDF && (
                <div className="form-group">
                  <h4>📄 Previously Uploaded Investigation Report</h4>
                  <iframe
                    src={uploadedPDF}
                    width="100%"
                    height="400px"
                    title="Investigation Report"
                  ></iframe>
                </div>
              )}

              {/* Conclusion from Previous Report */}
              <div className="form-group">
                <label>Conclusion from Previous Report</label>
                <textarea
                  name="conclusionFromPreviousReport"
                  value={formData.conclusionFromPreviousReport}
                  onChange={handleChange}
                  disabled={isSubmitted}
                />
              </div>

              {/* Scope of Work */}
              <div className="form-group">
                <label>Scope of Work</label>
                <textarea
                  name="scopeOfWork"
                  value={formData.scopeOfWork}
                  onChange={handleChange}
                  disabled={isSubmitted}
                />
              </div>

              {/* Purpose of Investigation */}
              <div className="form-group">
                <label>Purpose of Investigation</label>
                <textarea
                  name="purposeOfInvestigation"
                  value={formData.purposeOfInvestigation}
                  onChange={handleChange}
                  disabled={isSubmitted}
                />
              </div>
            </>
          )}

          {!isSubmitted && (
            <button type="submit" className="structural-changes-submit-btn">
              Save & Next
            </button>
          )}
        </form>
      )}
    </div>
  );
}

export default StructuralChangesPage;
