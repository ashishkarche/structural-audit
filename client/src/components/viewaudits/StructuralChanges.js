import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaEye } from "react-icons/fa"; // Eye icon for viewing reports
// import "../../static/StructuralChanges.css";

function StructuralChanges() {
  const { auditId } = useParams();
  const [structuralChanges, setStructuralChanges] = useState([]);
  const [error, setError] = useState("");

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

  const handleViewReport = async (changeId) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" };

      const response = await axios.get(
        `https://structural-audit.vercel.app/api/audits/${auditId}/structural-changes/${changeId}/report`,
        config
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url);
    } catch (err) {
      console.error("Error fetching report:", err);
      alert("Failed to open report. Please try again.");
    }
  };

  return (
    <div className="structural-changes-container">
      <h2>Structural Changes</h2>
      {error && <p className="error-message">{error}</p>}
      {structuralChanges.length > 0 ? (
        <table className="audit-table">
          <thead>
            <tr>
              <th>Brief Background</th>
              <th>Details</th>
              <th>Date of Change</th>
              <th>Structural Changes</th>
              <th>Change Details</th>
              <th>Previous Investigation</th>
              <th>Report</th> {/* Added Report column */}
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
                  {item.has_report ? (
                    <button className="view-report-btn" onClick={() => handleViewReport(item.id)}>
                      <FaEye /> View Report
                    </button>
                  ) : (
                    "No Report"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No structural changes recorded.</p>
      )}
    </div>
  );
}

export default StructuralChanges;
