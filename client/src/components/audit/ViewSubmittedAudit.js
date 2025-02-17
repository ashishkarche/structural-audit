import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/ViewSubmittedAudit.css";
import { FaArrowLeft, FaDownload } from "react-icons/fa";

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

  const handleGenerateReport = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
  
      // 📌 Show loading state (Optional)
      alert("Generating report, please wait...");
  
      // 📌 Request report generation & immediate download
      const response = await axios.get(
        `https://structural-audit.vercel.app/api/audits/${auditId}/report`,
        { ...config, responseType: "blob" }
      );
  
      // 📌 Create a downloadable link for the PDF
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
      <div className="table-container"><table className="audit-table">
        <tbody>
          <tr><td><strong>Project Name:</strong></td><td>{audit.name}</td></tr>
          <tr><td><strong>Location:</strong></td><td>{audit.location}</td></tr>
          <tr><td><strong>Year Of Construction:</strong></td><td>{audit.year_of_construction}</td></tr>
          <tr><td><strong>Date of Audit:</strong></td><td>{audit.date_of_audit}</td></tr>
          <tr><td><strong>Area:</strong></td><td>{audit.area}</td></tr>
          <tr><td><strong>Structure Type:</strong></td><td>{audit.structure_type}</td></tr>
          <tr><td><strong>Cement Type:</strong></td><td>{audit.cement_type}</td></tr>
          <tr><td><strong>Steel Type:</strong></td><td>{audit.steel_type}</td></tr>
          <tr><td><strong>Number of Stories:</strong></td><td>{audit.number_of_stories}</td></tr>
          <tr><td><strong>Designed Use:</strong></td><td>{audit.designed_use}</td></tr>
          <tr><td><strong>Present Use:</strong></td><td>{audit.present_use}</td></tr>
          <tr><td><strong>Change In Building:</strong></td><td>{audit.changes_in_building}</td></tr>
          <tr><td><strong>Distress Year:</strong></td><td>{audit.distress_year || "N/A"}</td></tr>
          <tr><td><strong>Distress Nature:</strong></td><td>{audit.distress_nature || "N/A"}</td></tr>
        </tbody>
      </table>
      </div>

      {/* Structural Changes Table */}
      <h3>Structural Changes</h3>
      <div className="table-container">{structuralChanges.length > 0 ? (
        <table className="audit-table">
          <thead>
            <tr>
              <th>brief_background_history</th>
              <th>Date</th>
              <th>Details</th>
              <th>Previous Investigations</th>
              <th>Repair Year</th>
              <th>Repair Type</th>
              <th>Repair Efficacy</th>
              <th>Repair Cost</th>
              <th>conclusion from previous report</th>
              <th>scope of work</th>
              <th>purpose of investigation</th>
            </tr>
          </thead>
          <tbody>
            {structuralChanges.map((item) => (
              <tr key={item.id}>
                <td>{item.brief_background_history}</td>
                <td>{item.date_of_change}</td>
                <td>{item.change_details}</td>
                <td>
                  {item.previous_investigations ? (
                    <a
                      href={`https://structural-audit.vercel.app/uploads/${item.previous_investigations}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View File
                    </a>
                  ) : "No File"}
                </td>
                <td>{item.repair_year || "N/A"}</td>
                <td>{item.repair_type || "N/A"}</td>
                <td>{item.repair_efficacy || "N/A"}</td>
                <td>
                  {item.repair_cost && !isNaN(item.repair_cost)
                    ? `$${parseFloat(item.repair_cost).toFixed(2)}`
                    : "N/A"}
                </td>
                <td>{item.conclusion_from_previous_report || "N/A"}</td>
                <td>{item.scope_of_work || "N/A"}</td>
                <td>{item.purpose_of_investigation || "N/A"}</td>

              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No structural changes recorded.</p>
      )}</div>



      {/* Observations Table */}
      <h3>Observations</h3>
      <div className="table-container">{observations.length > 0 ? (
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
              <th>Floor Sagging</th>
              <th>Bulging Walls</th>
              <th>Window Problems</th>
              <th>Heaving Floor</th>
              <th>Concrete Texture</th>
              <th>Algae Growth</th>
              <th>Damage Photo</th>
            </tr>
          </thead>
          <tbody>
            {observations.map((item) => (
              <tr key={item.id}>
                <td>{item.unexpected_load ? "Yes" : "No"}</td>
                <td>{item.unapproved_changes ? "Yes" : "No"}</td>
                <td>{item.additional_floor ? "Yes" : "No"}</td>
                <td>{item.vegetation_growth ? "Yes" : "No"}</td>
                <td>{item.leakage ? "Yes" : "No"}</td>
                <td>{item.cracks_beams ? "Yes" : "No"}</td>
                <td>{item.cracks_columns ? "Yes" : "No"}</td>
                <td>{item.cracks_flooring ? "Yes" : "No"}</td>
                <td>{item.floor_sagging ? "Yes" : "No"}</td>
                <td>{item.bulging_walls ? "Yes" : "No"}</td>
                <td>{item.window_problems ? "Yes" : "No"}</td>
                <td>{item.heaving_floor ? "Yes" : "No"}</td>
                <td>{item.concrete_texture || "N/A"}</td>
                <td>{item.algae_growth ? "Yes" : "No"}</td>
                <td>
                  {item.damage_photo ? (
                    <a href={`https://structural-audit.vercel.app/${item.damage_photo}`} target="_blank" rel="noopener noreferrer">
                      <img src={`https://structural-audit.vercel.app/${item.damage_photo}`} alt="Damage" width="50" height="50" />
                    </a>
                  ) : "No Photo"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No observations recorded.</p>
      )}</div>
      


      {/* Immediate Concerns Table */}
      <h3>Immediate Concerns</h3>
      <div className="table-container">{immediateConcerns.length > 0 ? (
        <table className="audit-table">
          <thead>
            <tr><th>Description</th><th>Location</th><th>Effect</th><th>recommended_measures</th><th>damage_photo</th></tr>
          </thead>
          <tbody>
            {immediateConcerns.map((item) => (
              <tr key={item.id}>
                <td>{item.concern_description || "N/A"}</td>
                <td>{item.location || "N/A"}</td>
                <td>{item.effect_description || "N/A"}</td>
                <td>{item.recommended_measures || "N/A"}</td>
                <td>{item.damage_photo || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p>No immediate concerns recorded.</p>}</div>
      

      {/* NDT Test Results Table */}
      <h3>NDT Test Results</h3>
      <div className="table-container">{ndtTests.length > 0 ? (
        <table className="audit-table">
          <thead>
            <tr><th>Rebound Hammer</th><th>Ultrasonic Test</th><th>Core Sampling</th><th>Carbonation Test</th><th>chloride_test</th><th>sulfate_test</th><th>half_cell_potential_test</th><th>concrete_cover_measurement</th><th>rebar_diameter_reduction</th></tr>
          </thead>
          <tbody>
            {ndtTests.map((item) => (
              <tr key={item.id}>
                <td>{item.rebound_hammer_test || "N/A"}</td>
                <td>{item.ultrasonic_test || "N/A"}</td>
                <td>{item.core_sampling_test || "N/A"}</td>
                <td>{item.carbonation_test || "N/A"}</td>
                <td>{item.chloride_test || "N/A"}</td>
                <td>{item.sulfate_test || "N/A"}</td>
                <td>{item.half_cell_potential_test || "N/A"}</td>
                <td>{item.concrete_cover_measurement || "N/A"}</td>
                <td>{item.rebar_diameter_reduction || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p>No NDT test results recorded.</p>}</div>
      
    </div>
  );
}

export default ViewSubmittedAudit;
