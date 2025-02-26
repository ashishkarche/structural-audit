import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
// import "../../static/AuditDrawings.css";
import { FaEye } from "react-icons/fa";

function AuditDrawings() {
  const { auditId } = useParams();
  const [drawings, setDrawings] = useState([]);
  const [error, setError] = useState("");
  const [selectedPDF, setSelectedPDF] = useState(null);

  useEffect(() => {
    const fetchDrawings = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`https://structural-audit.vercel.app/api/audits/${auditId}/drawings`, config);

        setDrawings(response.data);
      } catch (err) {
        console.error("Error fetching drawings:", err);
        setError("Failed to load audit drawings.");
      }
    };

    fetchDrawings();
  }, [auditId]);

  return (
    <div className="audit-drawings-container">
      <h2>Audit Drawings</h2>
      {error && <p className="error-message">{error}</p>}
      {drawings.length > 0 ? (
        <table className="audit-table">
          <thead>
            <tr>
              <th>Drawing Type</th>
              <th>View File</th>
            </tr>
          </thead>
          <tbody>
            {drawings.map((drawing) => (
              <tr key={drawing.id}>
                <td>{drawing.drawing_type}</td>
                <td>
                  <button onClick={() => setSelectedPDF(`data:application/pdf;base64,${drawing.file_data}`)}>
                    <FaEye /> View PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No audit drawings recorded.</p>
      )}

      {/* PDF Viewer Modal */}
      {selectedPDF && (
        <div className="modal" onClick={() => setSelectedPDF(null)}>
          <iframe src={selectedPDF} width="100%" height="600px" title="PDF Preview"></iframe>
        </div>
      )}
    </div>
  );
}

export default AuditDrawings;
