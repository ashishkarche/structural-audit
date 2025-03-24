import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/ViewSubmittedAudit.css";
import { FaArrowLeft, FaDownload, FaEye } from "react-icons/fa";
import StructuralChanges from "../viewaudits/StructuralChanges";
import ImmediateConcerns from "../viewaudits/ImmediateConcerns";
import AuditDrawings from "../viewaudits/AuditDrawings";

function ViewSubmittedAudit() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [fullAudit, setFullAudit] = useState(null);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchFullAudit = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`https://structural-audit.vercel.app/api/audits/${auditId}/full`, config);
        setFullAudit(response.data);
      } catch (err) {
        console.error("Error fetching audit details:", err);
        setError("Failed to load audit details.");
      }
    };

    fetchFullAudit();
  }, [auditId]);

  if (error) return <div className="error-message">{error}</div>;
  if (!fullAudit) return <div className="loading-message">Loading audit details...</div>;

  const { audit, structuralChanges, observations, immediateConcerns, ndtTests, dataEntries, auditDrawings } = fullAudit;

  const handleViewImage = (base64Array) => {
    setSelectedImage(base64Array);
  };

  const handleGenerateReport = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      alert("Generating report, please wait...");

      const response = await axios.get(
        `https://structural-audit.vercel.app/api/audits/${auditId}/report`,
        { ...config, responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Audit_Report_${auditId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      alert("Report downloaded successfully!");
    } catch (err) {
      console.error("Error generating report:", err);
      alert("Failed to generate/download report. Please try again.");
    }
  };

  return (
    <div className="view-audit-container">
      <button className="back-button" onClick={() => navigate(`/view-audits`)}>
        <FaArrowLeft /> Back
      </button>
      <button className="generate-report-btn" onClick={handleGenerateReport}>
        <FaDownload /> Generate Report
      </button>

      <h2>Audit Details</h2>
      <div className="table-container">
        <table className="audit-table">
          <tbody>
            <tr><td><strong>Project Name:</strong></td><td>{audit.name}</td></tr>
            <tr><td><strong>Location:</strong></td><td>{audit.location}</td></tr>
            <tr><td><strong>Year Of Construction:</strong></td><td>{audit.year_of_construction}</td></tr>
            <tr>
              <td><strong>Date of Audit:</strong></td>
              <td>{audit.date_of_audit ? new Date(audit.date_of_audit).toLocaleDateString("en-GB") : "N/A"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <StructuralChanges structuralChanges={structuralChanges} />
      <ImmediateConcerns immediateConcerns={immediateConcerns} />
      <AuditDrawings auditDrawings={auditDrawings} />

      <h3>Observations</h3>
      <div className="table-container">
        {observations?.length > 0 ? (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Unexpected Load</th>
                <th>Unapproved Changes</th>
                <th>Additional Floor</th>
                <th>Vegetation Growth</th>
                <th>Leakage</th>
                <th>Cracks (Beams)</th>
                <th>Cracks (Columns)</th>
                <th>Cracks (Flooring)</th>
                <th>Damage Description</th>
                <th>Damage Photo</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((item) => {
                const damageEntry = dataEntries?.find((d) => d.audit_id === item.audit_id);
                return (
                  <tr key={item.id}>
                    <td>{item.unexpected_load ? "Yes" : "No"}</td>
                    <td>{item.unapproved_changes ? "Yes" : "No"}</td>
                    <td>{item.additional_floor ? "Yes" : "No"}</td>
                    <td>{item.vegetation_growth ? "Yes" : "No"}</td>
                    <td>{item.leakage ? "Yes" : "No"}</td>
                    <td>{item.cracks_beams ? "Yes" : "No"}</td>
                    <td>{item.cracks_columns ? "Yes" : "No"}</td>
                    <td>{item.cracks_flooring ? "Yes" : "No"}</td>
                    <td>{damageEntry?.description || "N/A"}</td>
                    <td>
                    {damageEntry?.damage_photos?.length > 0 ? (
                        <button onClick={() => handleViewImage(damageEntry.damage_photos)}>
                          <FaEye /> View Images
                        </button>
                      ) : "No Photos"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p>No observations recorded.</p>}
      </div>

      <h3>NDT Test Results</h3>
      <div className="table-container">
        {ndtTests.length > 0 ? (
          <table className="audit-table">
            <thead>
              <tr><th>Test Type</th><th>Value</th><th>Quality</th><th>Recommendation</th><th>Image</th></tr>
            </thead>
            <tbody>
              {ndtTests.map((test) => (
                Object.keys(test).map((key) => (
                  key.includes("_image") ? (
                    test[key] ? (
                      <tr key={key}>
                        <td colSpan="4"><strong>{key.replace(/_/g, " ")}</strong></td>
                        <td>
                          <button onClick={() => handleViewImage(test[key])}>
                            <FaEye /> View Image
                          </button>
                        </td>
                      </tr>
                    ) : null
                  ) : (
                    test[key] && test[key] !== "N/A" ? (
                      <tr key={`${test.id}-${key}`}>
                        <td><strong>{key.replace(/_/g, " ")}</strong></td>
                        <td>{test[key]}</td>
                        <td>{test[key]}</td>
                        <td>{test[key]}</td>
                      </tr>
                    ) : null
                  )
                ))
              ))}
            </tbody>
          </table>
        ) : <p>No NDT test results recorded.</p>}
      </div>

      {selectedImage.length > 0 && (
        <div className="modal" onClick={() => setSelectedImage([])}>
          {selectedImage.map((img, index) => (
            <img key={index} src={`data:image/jpeg;base64,${img}`} alt={`Preview ${index + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewSubmittedAudit;
