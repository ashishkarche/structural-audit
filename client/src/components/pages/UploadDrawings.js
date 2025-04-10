import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../static/UploadDrawings.css";
import ToastNotification from "../../components/ToastNotification"; // Import Notification Component

function UploadDrawings() {
  const { auditId } = useParams();
  const navigate = useNavigate();

  const [drawings, setDrawings] = useState({
    architecturalDrawing: null,
    structuralDrawing: null,
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    architecturalDrawing: null,
    structuralDrawing: null,
  });

  const [error, setError] = useState("");
  const [toast, setToast] = useState(null); // Toast notification state

  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // ✅ Track if drawings are already uploaded

  // ✅ Load PDFs from backend
  useEffect(() => {
    const fetchDrawings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `https://your-api/api/files/${auditId}/drawings`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.architecturalDrawing || response.data.structuralDrawing) {
          setIsSubmitted(true); // ✅ Disable fields if drawings are already uploaded
        }

        // ✅ Set separate URLs for architectural & structural drawings
        setUploadedFiles({
          architecturalDrawing: response.data.architecturalDrawing || null,
          structuralDrawing: response.data.structuralDrawing || null,
        });
      } catch (err) {
        console.error("Error fetching uploaded drawings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDrawings();
  }, [auditId]);

  const handleFileChange = (e) => {
    if (isSubmitted) return; // Prevent changes if already submitted
    const { name, files } = e.target;
    setDrawings((prevDrawings) => ({ ...prevDrawings, [name]: files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } };

    try {
      const formData = new FormData();
      formData.append("auditId", auditId);

      if (drawings.architecturalDrawing) formData.append("architecturalDrawing", drawings.architecturalDrawing);
      if (drawings.structuralDrawing) formData.append("structuralDrawing", drawings.structuralDrawing);

      await axios.post("https://your-api/api/upload-drawings", formData, config);

      // ✅ Fetch updated PDFs after upload
      const updatedResponse = await axios.get(
        `https://your-api/api/files/${auditId}/drawings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUploadedFiles({
        architecturalDrawing: updatedResponse.data.architecturalDrawing || null,
        structuralDrawing: updatedResponse.data.structuralDrawing || null,
      });

      setIsSubmitted(true); // ✅ Lock fields after submission

      setToast({ message: "Submission Successful!", type: "success" }); // Show success toast

      setTimeout(() => navigate(`/audit/${auditId}/structural-changes`), 2000);
    } catch (err) {
      setToast({ message: "Submission Failed!", type: "error" }); // Show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-drawings-container">
      <h2>Upload Drawings</h2>
      {error && <p className="text-danger text-center">{error}</p>}
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />} {/* Notification */}

      {loading && <p className="text-center">Uploading files...</p>}

      <form onSubmit={handleSubmit} className="upload-form">
        {/* Architectural Drawing Upload */}
        <div className="form-group">
          <label>Architectural Drawing (PDF)</label>
          <input
            type="file"
            name="architecturalDrawing"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isSubmitted} // ✅ Disable if already submitted
          />
        </div>

        {/* Structural Drawing Upload */}
        <div className="form-group">
          <label>Structural Drawing (PDF)</label>
          <input
            type="file"
            name="structuralDrawing"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isSubmitted} // ✅ Disable if already submitted
          />
        </div>

        {/* ✅ Uploaded File Previews */}
        <div className="uploaded-files">
          {uploadedFiles.architecturalDrawing && (
            <div className="pdf-preview">
              <h4>📄 Architectural Drawing Preview</h4>
              <iframe src={uploadedFiles.architecturalDrawing} width="100%" height="400px" title="Architectural Drawing"></iframe>
            </div>
          )}

          {uploadedFiles.structuralDrawing && (
            <div className="pdf-preview">
              <h4>📄 Structural Drawing Preview</h4>
              <iframe src={uploadedFiles.structuralDrawing} width="100%" height="400px" title="Structural Drawing"></iframe>
            </div>
          )}
        </div>

        {/* ✅ Only show submit button if user hasn’t submitted yet */}
        {!isSubmitted && (
          <div className="form-group submit-btn-container">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Uploading..." : "Upload & Next"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default UploadDrawings;
