import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../static/ReportPage.css";

function ReportPage() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("You must be logged in to view reports.");
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get("https://structural-audit.vercel.app/api/reports", config);
        setReports(response.data);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // 📌 Handle Secure Report Download
  const handleDownloadReport = async (auditId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to download reports.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" };

      // 📌 Fetch the report
      const response = await axios.get(`https://structural-audit.vercel.app/api/audits/${auditId}/report`, config);

      // 📌 Trigger Download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Audit_Report_${auditId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Failed to download report. Please try again.");
    }
  };

  return (
    <div className="report-page-container">
      <h2>📑 Audit Reports</h2>

      {loading ? (
        <p className="loading-message">Loading reports...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : reports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Audit Name</th>
                <th>Location</th>
                <th>Date</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.name}</td>
                  <td>{report.location}</td>
                  <td>{report.date_of_audit}</td>
                  <td>
                    <button onClick={() => handleDownloadReport(report.id)} className="download-btn">
                      📥 Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReportPage;
