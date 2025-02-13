import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../static/AuditDetails.css";
import { FaArrowLeft } from "react-icons/fa";

function AuditDetails() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuditDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`https://structural-audit.vercel.app/api/audits/${auditId}`, config);
        setAudit(response.data);
      } catch (err) {
        console.error("Error fetching audit details:", err);
        setError("Failed to load audit details.");
      }
    };

    fetchAuditDetails();
  }, [auditId]);

  if (error) return <div className="audit-details-error">{error}</div>;
  if (!audit) return <div className="audit-details-loading">Loading audit details...</div>;

  return (
    <div className="audit-details-container">
      <div className="audit-details-header">
        <button className="back-btn" onClick={() => navigate('/view-audits')}>
          <FaArrowLeft /> Back
        </button>
        <h2>Audit Details</h2>
      </div>
      <div className="audit-details-card">
        <div className="audit-field">
          <span className="audit-label">Project Name:</span>
          <span className="audit-value">{audit.name}</span>
        </div>
        <div className="audit-field">
          <span className="audit-label">Location:</span>
          <span className="audit-value">{audit.location}</span>
        </div>
        <div className="audit-field">
          <span className="audit-label">Date of Audit:</span>
          <span className="audit-value">{audit.date_of_audit}</span>
        </div>
        <div className="audit-field">
          <span className="audit-label">Structural Changes:</span>
          <span className="audit-value">{audit.structural_changes}</span>
        </div>
        <div className="audit-field">
          <span className="audit-label">Distress Year:</span>
          <span className="audit-value">{audit.distress_year}</span>
        </div>
        <div className="audit-field">
          <span className="audit-label">Distress Nature:</span>
          <span className="audit-value">{audit.distress_nature}</span>
        </div>
        <div className="audit-field">
          <span className="audit-label">Previous Reports:</span>
          <span className="audit-value">{audit.previous_reports}</span>
        </div>
        <div className="audit-field">
          <span className="audit-label">Status:</span>
          <span className={`audit-status ${audit.status.toLowerCase()}`}>
            {audit.status}
          </span>
        </div>
        {audit.architectural_drawing && (
          <div className="audit-field">
            <span className="audit-label">Architectural Drawing:</span>
            <a
              className="audit-link"
              href={`https://structural-audit.vercel.app/${audit.architectural_drawing}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Drawing
            </a>
          </div>
        )}
        {audit.structural_drawing && (
          <div className="audit-field">
            <span className="audit-label">Structural Drawing:</span>
            <a
              className="audit-link"
              href={`https://structural-audit.vercel.app/uploads/${audit.structural_drawing}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Drawing
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditDetails;
