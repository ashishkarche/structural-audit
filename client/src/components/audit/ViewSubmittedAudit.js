import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/ViewSubmittedAudit.css";
import { FaArrowLeft, FaDownload, FaEye } from "react-icons/fa";

function ViewSubmittedAudit() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [fullAudit, setFullAudit] = useState(null);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPDF, setSelectedPDF] = useState(null);

  const [uploadedDrawings, setUploadedDrawings] = useState([]);


  useEffect(() => {
    const fetchFullAudit = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`https://structural-audit.vercel.app/api/audits/${auditId}/full`, config);

        setFullAudit(response.data);

        // Fetch uploaded drawings separately
        const drawingsResponse = await axios.get(`https://structural-audit.vercel.app/api/files/${auditId}/drawings`, config);
        setUploadedDrawings(drawingsResponse.data);

      } catch (err) {
        console.error("Error fetching audit details:", err);
        setError("Failed to load audit details.");
      }
    };

    fetchFullAudit();
  }, [auditId]);

  if (error) return <div className="error-message">{error}</div>;
  if (!fullAudit) return <div className="loading-message">Loading audit details...</div>;

  const { audit, structuralChanges, observations, immediateConcerns, ndtTests, dataEntries } = fullAudit;

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

  // ✅ Convert PDF BLOB to URL
  const handleViewPDF = (blobData) => {
    const blob = new Blob([blobData], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setSelectedPDF(url);
  };

  // ✅ Convert Image BLOB to URL
  const handleViewImage = (blobData) => {
    if (!blobData) return;
    const imageUrl = `data:image/jpeg;base64,${blobData}`;
    setSelectedImage(imageUrl);
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
                    <button onClick={() => setSelectedPDF(item.previous_investigations)}>
                      <FaEye /> View PDF
                    </button>
                  ) : "No File"}
                </td>
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

<h3>Uploaded Drawings</h3>
      <div className="table-container">
        {uploadedDrawings.length > 0 ? (
          <table className="audit-table">
            <thead>
              <tr><th>Architectural Drawing</th><th>Structural Drawing</th></tr>
            </thead>
            <tbody>
              {uploadedDrawings.map((drawing, index) => (
                <tr key={index}>
                  <td>
                    {drawing.drawing_type === "architecturalDrawing" && drawing.file_data ? (
                      <button onClick={() => handleViewPDF(drawing.file_data)}>
                        <FaEye /> View PDF
                      </button>
                    ) : "No File"}
                  </td>
                  <td>
                    {drawing.drawing_type === "structuralDrawing" && drawing.file_data ? (
                      <button onClick={() => handleViewPDF(drawing.file_data)}>
                        <FaEye /> View PDF
                      </button>
                    ) : "No File"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No uploaded drawings found.</p>
        )}
      </div>



      {/* 🔹 Observations Table (Now Includes Damage Photos from DamageEntries) */}
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
                <th>Floor Sagging</th>
                <th>Bulging Walls</th>
                <th>Window Problems</th>
                <th>Heaving Floor</th>
                <th>Algae Growth</th>
                <th>Damage Description</th>
                <th>Damage Location</th>
                <th>Damage Cause</th>
                <th>Damage Classification</th>
                <th>Damage Photo</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((item) => {
                // ✅ Ensure `dataEntries` exists before calling `.find()`
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
                    <td>{item.floor_sagging ? "Yes" : "No"}</td>
                    <td>{item.bulging_walls ? "Yes" : "No"}</td>
                    <td>{item.window_problems ? "Yes" : "No"}</td>
                    <td>{item.heaving_floor ? "Yes" : "No"}</td>
                    <td>{item.algae_growth ? "Yes" : "No"}</td>

                    {/* 🔹 Ensure damage data exists */}
                    <td>{damageEntry?.description || "N/A"}</td>
                    <td>{damageEntry?.location || "N/A"}</td>
                    <td>{damageEntry?.cause || "N/A"}</td>
                    <td>{damageEntry?.classification || "N/A"}</td>

                    {/* 🔹 View Damage Photo (Stored as BLOB) */}
                    <td>
                      {damageEntry?.damage_photos ? (
                        <button onClick={() => handleViewImage(damageEntry.damage_photos)}>
                          <FaEye /> View Image
                        </button>
                      ) : "No Photo"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No observations recorded.</p>
        )}
      </div>



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
       {/* 🔹 NDT Test Results (Fix JSON Parsing) */}
       <h3>NDT Test Results</h3>
      <div className="table-container">
        {ndtTests.length > 0 ? (
          <table className="audit-table">
            <thead>
              <tr><th>Test Type</th><th>Value</th><th>Quality</th><th>Recommendation</th></tr>
            </thead>
            <tbody>
              {ndtTests.map((test) => (
                Object.keys(test).map((key) => (
                  key !== "id" && test[key] ? (
                    <tr key={`${test.id}-${key}`}>
                      <td><strong>{key.replace(/_/g, " ")}</strong></td>
                      {(() => {
                        try {
                          const data = JSON.parse(test[key]);
                          return (
                            <>
                              <td>{data.value || "N/A"}</td>
                              <td>{data.quality || "N/A"}</td>
                              <td>{data.recommendation || "N/A"}</td>
                            </>
                          );
                        } catch {
                          return <td colSpan="3">Invalid Data</td>;
                        }
                      })()}
                    </tr>
                  ) : null
                ))
              ))}
            </tbody>
          </table>
        ) : (
          <p>No NDT test results recorded.</p>
        )}
      </div>


      {/* 🔹 PDF Viewer Modal */}
      {selectedPDF && (
        <div className="modal" onClick={() => setSelectedPDF(null)}>
          <iframe src={selectedPDF} width="100%" height="600px" title="PDF Preview"></iframe>
        </div>
      )}

      {/* 🔹 Image Viewer Modal */}
      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Preview" />
        </div>
      )}
    </div>
  );
}

export default ViewSubmittedAudit;
