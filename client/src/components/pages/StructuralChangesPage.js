import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/StructuralChangesPage.css";

function StructuralChangesPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    briefBackgroundHistory: "No",
    briefHistoryDetails: "",
    dateOfChange: "",
    structuralChanges: "No",
    changeDetails: "",
    previousInvestigation: "No",
    investigationFile: null,
    conclusionFromPreviousReport: "",
    scopeOfWork: "",
    purposeOfInvestigation: "",
  });

  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadedPDF, setUploadedPDF] = useState(null); // ✅ Store the uploaded PDF

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Session expired. Please log in again.");
          navigate("/");
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(
          `https://structural-audit.vercel.app/api/structural-changes/${auditId}`,
          config
        );

        if (response.status === 200 && response.data) {
          setFormData(response.data);
          setIsSubmitted(response.data.isSubmitted || false);

          // Fetch uploaded investigation report (PDF) if available
          if (response.data.previousInvestigationReport) {
            const pdfBlob = new Blob([response.data.previousInvestigationReport], {
              type: "application/pdf",
            });
            setUploadedPDF(URL.createObjectURL(pdfBlob));
          }
        } else {
          setError("No structural changes found for this audit.");
        }
      } catch (err) {
        setError("An error occurred while fetching data.");
      }
    };

    fetchData();
  }, [auditId, navigate]);

  const handleChange = (e) => {
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
        `https://structural-audit.vercel.app/api/structural-changes/${auditId}`,
        formDataToSend,
        config
      );

      navigate(`/audit/${auditId}/observations`);
    } catch (err) {
      setError("Failed to submit structural changes.");
    }
  };

  return (
    <div className="structural-changes-page-container">
      <h2 className="structural-changes-page-title">Structural Changes</h2>

      {error && <p className="structural-changes-error-message">{error}</p>}

      {isSubmitted ? (
        <p>Your data has already been submitted. You can view or edit other sections.</p>
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
                    />
                    No
                  </label>
                </div>
              </div>

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
                    />
                    No
                  </label>
                </div>
              </div>

              {formData.previousInvestigation === "Yes" && (
                <div className="form-group">
                  <label>Upload Investigation Report (PDF)</label>
                  <input
                    type="file"
                    name="investigationFile"
                    accept="application/pdf"
                    onChange={handleChange}
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
                />
              </div>

              {/* Scope of Work */}
              <div className="form-group">
                <label>Scope of Work</label>
                <textarea
                  name="scopeOfWork"
                  value={formData.scopeOfWork}
                  onChange={handleChange}
                />
              </div>

              {/* Purpose of Investigation */}
              <div className="form-group">
                <label>Purpose of Investigation</label>
                <textarea
                  name="purposeOfInvestigation"
                  value={formData.purposeOfInvestigation}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <button type="submit" className="structural-changes-submit-btn">
            Save & Next
          </button>
        </form>
      )}
    </div>
  );
}

export default StructuralChangesPage;
