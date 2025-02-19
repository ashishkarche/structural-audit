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

  const [uploadedFiles, setUploadedFiles] = useState({}); // Stores uploaded file names
  const [error, setError] = useState("");

  // Load previously uploaded file names from localStorage
  useEffect(() => {
    const savedFiles = JSON.parse(localStorage.getItem(`audit_${auditId}_drawings`)) || {};
    setUploadedFiles(savedFiles);
  }, [auditId]);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setDrawings((prevDrawings) => ({ ...prevDrawings, [name]: files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } };

    try {
      const formData = new FormData();
      formData.append("auditId", auditId);

      // Append both files if selected
      if (drawings.architecturalDrawing) formData.append("architecturalDrawing", drawings.architecturalDrawing);
      if (drawings.structuralDrawing) formData.append("structuralDrawing", drawings.structuralDrawing);

      const response = await axios.post("https://structural-audit.vercel.app/api/upload-drawings", formData, config);

      // Save uploaded file info in localStorage
      localStorage.setItem(`audit_${auditId}_drawings`, JSON.stringify(response.data.uploadedFiles));
      setUploadedFiles(response.data.uploadedFiles);

      // Redirect to Structural Changes page
      navigate(`/audit/${auditId}/structural-changes`);
    } catch (err) {
      setError("Failed to upload drawings. Please try again.");
    }
  };

  return (
    <div className="upload-drawings-container">
      <h2>Upload Drawings</h2>
      {error && <p className="text-danger text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>Architectural Drawing (PDF)</label>
          <input type="file" name="architecturalDrawing" accept="application/pdf" onChange={handleFileChange} />
          {uploadedFiles.architecturalDrawing && <p className="uploaded-file">Uploaded: {uploadedFiles.architecturalDrawing}</p>}
        </div>

        <div className="form-group">
          <label>Structural Drawing (PDF)</label>
          <input type="file" name="structuralDrawing" accept="application/pdf" onChange={handleFileChange} />
          {uploadedFiles.structuralDrawing && <p className="uploaded-file">Uploaded: {uploadedFiles.structuralDrawing}</p>}
        </div>

        <div className="form-group submit-btn-container">
          <button type="submit" className="submit-btn">Upload & Next</button>
        </div>
      </form>
    </div>
  );
}

export default UploadDrawings;
