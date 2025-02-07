import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../static/AuditDetails.css";
import { FaArrowLeft } from "react-icons/fa";

function AuditDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuditDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`http://localhost:5000/api/audits/${id}`, config);
        setAudit(response.data);
      } catch (err) {
        console.error("Error fetching audit details:", err);
        setError("Failed to load audit details.");
      }
    };
    fetchAuditDetails();
  }, [id]);

  if (error) return <p className="text-danger text-center">{error}</p>;
  if (!audit) return <p className="text-center">Loading...</p>;

  return (
    <div className="audit-details-container">
      <button className="back-btn" onClick={() => navigate("/view-audits")}>
        <FaArrowLeft /> Back to Audits
      </button>

      <h2>Audit Details</h2>
      <div className="audit-info">
        <p><strong>Project Name:</strong> {audit.name}</p>
        <p><strong>Location:</strong> {audit.location}</p>
        <p><strong>Date of Audit:</strong> {audit.date_of_audit}</p>
        <p><strong>Structural Changes:</strong> {audit.structural_changes}</p>
        <p><strong>Distress Year:</strong> {audit.distress_year}</p>
        <p><strong>Distress Nature:</strong> {audit.distress_nature}</p>
        <p><strong>Previous Reports:</strong> {audit.previous_reports}</p>
        <p><strong>Status:</strong> <span className={`status1 ${audit.status.toLowerCase()}`}>{audit.status}</span></p>

        {audit.architectural_drawing && (
          <p>
            <strong>Architectural Drawing:</strong>{" "}
            <a href={`http://localhost:5000/${audit.architectural_drawing}`} target="_blank" rel="noopener noreferrer">
              View
            </a>
          </p>
        )}

        {audit.structural_drawing && (
          <p>
            <strong>Structural Drawing:</strong>{" "}
            <a href={`http://localhost:5000/${audit.structural_drawing}`} target="_blank" rel="noopener noreferrer">
              View
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default AuditDetails;
