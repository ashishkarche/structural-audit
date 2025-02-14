// components/ViewSubmittedAudit.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/ViewSubmittedAudit.css";
import { FaArrowLeft } from "react-icons/fa";

function ViewSubmittedAudit() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [fullAudit, setFullAudit] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFullAudit = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`https://structural-audit.vercel.app/api/audits/${auditId}/full`, config);
        setFullAudit(response.data);
      } catch (err) {
        console.error("Error fetching full audit details:", err);
        setError("Failed to load audit details.");
      }
    };
    fetchFullAudit();
  }, [auditId]);

  if (error) return <div className="error-message">{error}</div>;
  if (!fullAudit) return <div className="loading-message">Loading audit details...</div>;

  const { audit, structuralChanges, observations, immediateConcerns, ndtTests } = fullAudit;

  return (
    <div className="view-audit-container">
      <button className="back-button" onClick={() => navigate(`/view-audits`)}>
        <FaArrowLeft /> Back
      </button>
      <h2>Audit Details</h2>
      <div className="audit-summary">
        <p><strong>Project Name:</strong> {audit.name}</p>
        <p><strong>Location:</strong> {audit.location}</p>
        <p><strong>Date of Audit:</strong> {audit.date_of_audit}</p>
        <p><strong>Status:</strong> {audit.status}</p>
      </div>
      
      <section className="audit-section">
        <h3>Structural Changes</h3>
        {structuralChanges.length > 0 ? (
          <ul className="sub-table-list">
            {structuralChanges.map((item) => (
              <li key={item.id}>
                <p><strong>Date:</strong> {item.date_of_change}</p>
                <p><strong>Details:</strong> {item.change_details}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No structural changes recorded.</p>
        )}
      </section>
      
      <section className="audit-section">
        <h3>Observations</h3>
        {observations.length > 0 ? (
          <ul className="sub-table-list">
            {observations.map((item) => (
              <li key={item.id}>
                <p><strong>Unexpected Load:</strong> {item.unexpected_load ? "Yes" : "No"}</p>
                <p><strong>Concrete Texture:</strong> {item.concrete_texture}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No observations recorded.</p>
        )}
      </section>
      
      <section className="audit-section">
        <h3>Immediate Concerns</h3>
        {immediateConcerns.length > 0 ? (
          <ul className="sub-table-list">
            {immediateConcerns.map((item) => (
              <li key={item.id}>
                <p><strong>Description:</strong> {item.concern_description}</p>
                <p><strong>Location:</strong> {item.location}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No immediate concerns recorded.</p>
        )}
      </section>
      
      <section className="audit-section">
        <h3>NDT Test Results</h3>
        {ndtTests.length > 0 ? (
          <ul className="sub-table-list">
            {ndtTests.map((item) => (
              <li key={item.id}>
                <p><strong>Rebound Hammer Test:</strong> {item.rebound_hammer_test}</p>
                <p><strong>Ultrasonic Test:</strong> {item.ultrasonic_test}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No NDT test results recorded.</p>
        )}
      </section>
    </div>
  );
}

export default ViewSubmittedAudit;
