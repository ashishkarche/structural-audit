import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaEye } from "react-icons/fa";

function ImmediateConcerns() {
  const { auditId } = useParams();
  const [selectedImage, setSelectedImage] = useState(null);
  const [immediateConcerns, setImmediateConcerns] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchImmediateConcerns = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`https://structural-audit.vercel.app/api/audits/${auditId}/immediate-concerns`, config);

        setImmediateConcerns(response.data);
      } catch (err) {
        console.error("Error fetching immediate concerns:", err);
        setError("Failed to load immediate concerns.");
      }
    };

    fetchImmediateConcerns();
  }, [auditId]);

  // ✅ Convert Base64 to Image URL
  const handleViewImage = (base64Data) => {
    if (!base64Data) return;
    const imageUrl = `data:image/jpeg;base64,${base64Data}`;
    setSelectedImage(imageUrl);
  };

  return (
    <div className="immediate-concerns-container">
      {/* 🔹 Image Viewer Modal */}
      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Preview" />
        </div>
      )}

      <h2>Immediate Concerns</h2>
      {error && <p className="error-message">{error}</p>}
      {immediateConcerns.length > 0 ? (
        <table className="audit-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Location</th>
              <th>Effect</th>
              <th>Recommended Measures</th>
              <th>Damage Photo</th>
            </tr>
          </thead>
          <tbody>
            {immediateConcerns.map((item, index) => (
              <tr key={index}>
                <td>{item.concern_description || "N/A"}</td>
                <td>{item.location || "N/A"}</td>
                <td>{item.effect_description || "N/A"}</td>
                <td>{item.recommended_measures || "N/A"}</td>
                <td>
                  {item.damage_photo ? (
                    <button onClick={() => handleViewImage(item.damage_photo)}>
                      <FaEye /> View Image
                    </button>
                  ) : (
                    "No Photo"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No immediate concerns recorded.</p>
      )}
    </div>
  );
}

export default ImmediateConcerns;
