import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/AuditDetails.css";
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
        const response = await axios.get(`https://your-api/api/audits/${auditId}`, config);
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
          <FaArrowLeft /> View in Audits
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
          <span className="audit-label">Distress Year:</span>
          <span className="audit-value">{audit.distress_year}</span>
        </div>
        <div className="audit-field">
          <span className="audit-label">Distress Nature:</span>
          <span className="audit-value">{audit.distress_nature}</span>
        </div>
        <div className="audit-field">
            <span className="audit-label">Conclusion:</span>
            <span className="audit-value">{audit.finalSubmission.conclusion}</span>
          </div>
          <div className="audit-field">
            <span className="audit-label">Recommendations:</span>
            <span className="audit-value">{audit.finalSubmission.recommendations}</span>
          </div>
          <div className="audit-field">
            <span className="audit-label">Technical Comments on Distress:</span>
            <span className="audit-value">{audit.finalSubmission.technical_comments}</span>
          </div>
          <div className="audit-field">
            <span className="audit-label">Executive Engineers' Comments:</span>
            <span className="audit-value">{audit.finalSubmission.executive_engineers}</span>
          </div>
          <div className="audit-field">
            <span className="audit-label">Superintending Engineers' Comments:</span>
            <span className="audit-value">{audit.finalSubmission.superintending_engineers}</span>
          </div>
          <div className="audit-field">
            <span className="audit-label">Chief Engineers' Comments:</span>
            <span className="audit-value">{audit.finalSubmission.chief_engineers}</span>
          </div>
      </div>

      
    </div>
  );
}

export default AuditDetails;
