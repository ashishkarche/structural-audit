import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../static/UploadDrawings.css";

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
  const [loading, setLoading] = useState(false);

  // Load uploaded PDFs from backend
  useEffect(() => {
    const fetchDrawings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token"); // ✅ Get Token
    
        const response = await axios.get(
          `https://structural-audit.vercel.app/api/files/${auditId}/drawings`,
          {
            headers: { Authorization: `Bearer ${token}` }, // ✅ Include Token
            responseType: "blob",
          }
        );
    
        const pdfUrl = URL.createObjectURL(response.data);
        setUploadedFiles({ architecturalDrawing: pdfUrl, structuralDrawing: pdfUrl });
    
      } catch (err) {
        console.error("Error fetching uploaded drawings:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDrawings();
  }, [auditId]);

  const handleFileChange = (e) => {
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

      await axios.post("https://structural-audit.vercel.app/api/upload-drawings", formData, config);

      // ✅ Fetch updated PDFs after upload
      const updatedResponse = await axios.get(
        `https://structural-audit.vercel.app/api/files/${auditId}/drawings`,
        { headers: { Authorization: `Bearer ${token}` },responseType: "blob" }
      );
      const updatedPdfUrl = URL.createObjectURL(updatedResponse.data);
      setUploadedFiles({ architecturalDrawing: updatedPdfUrl, structuralDrawing: updatedPdfUrl });

      // ✅ Navigate to next page
      navigate(`/audit/${auditId}/structural-changes`);
    } catch (err) {
      setError("Failed to upload drawings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-drawings-container">
      <h2>Upload Drawings</h2>
      {error && <p className="text-danger text-center">{error}</p>}
      {loading && <p className="text-center">Uploading files...</p>}

      <form onSubmit={handleSubmit} className="upload-form">
        {/* Architectural Drawing Upload */}
        <div className="form-group">
          <label>Architectural Drawing (PDF)</label>
          <input type="file" name="architecturalDrawing" accept="application/pdf" onChange={handleFileChange} />
        </div>

        {/* Structural Drawing Upload */}
        <div className="form-group">
          <label>Structural Drawing (PDF)</label>
          <input type="file" name="structuralDrawing" accept="application/pdf" onChange={handleFileChange} />
        </div>

        {/* Uploaded File Previews */}
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

        <div className="form-group submit-btn-container">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Uploading..." : "Upload & Next"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UploadDrawings;
