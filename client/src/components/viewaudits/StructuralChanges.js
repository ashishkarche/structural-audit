import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaEye } from "react-icons/fa";

function StructuralChanges() {
  const { auditId } = useParams();
  const [structuralChanges, setStructuralChanges] = useState([]);
  const [error, setError] = useState("");
  const [selectedPDF, setSelectedPDF] = useState(null);

  useEffect(() => {
    const fetchStructuralChanges = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(
          `https://structural-audit.vercel.app/api/audits/${auditId}/structural-changes`,
          config
        );

        setStructuralChanges(response.data);
      } catch (err) {
        console.error("Error fetching structural changes:", err);
        setError("Failed to load structural changes.");
      }
    };

    fetchStructuralChanges();
  }, [auditId]);

  return (
    <div className="structural-changes-container">
      <h2>Structural Changes</h2>
      {error && <p className="error-message">{error}</p>}
      {structuralChanges.length > 0 ? (
        <div className="table-container">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Brief Background</th>
                <th>Details</th>
                <th>Date of Change</th>
                <th>Structural Changes</th>
                <th>Change Details</th>
                <th>Previous Investigation</th>
                <th>Previous Investigation Report</th>
              </tr>
            </thead>
            <tbody>
              {structuralChanges.map((item) => (
                <tr key={item.id}>
                  <td>{item.brief_background_history ? "Yes" : "No"}</td>
                  <td>{item.brief_history_details || "N/A"}</td>
                  <td>{item.date_of_change ? new Date(item.date_of_change).toLocaleDateString("en-GB") : "N/A"}</td>
                  <td>{item.structural_changes ? "Yes" : "No"}</td>
                  <td>{item.change_details || "N/A"}</td>
                  <td>{item.previous_investigation ? "Yes" : "No"}</td>
                  <td>
                    <button onClick={() => setSelectedPDF(`data:application/pdf;base64,${item.previous_investigation_reports}`)}>
                      <FaEye /> View PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No structural changes recorded.</p>
      )}

      {selectedPDF && (
        <div className="modal" onClick={() => setSelectedPDF(null)}>
          <iframe src={selectedPDF} width="100%" height="600px" title="PDF Preview"></iframe>
        </div>
      )}
    </div>
  );
}

export default StructuralChanges;
