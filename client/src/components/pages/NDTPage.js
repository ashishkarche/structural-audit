import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReboundHammerTest from "../ntd-test/ReboundHammerTest";
import UltrasonicTest from "../ntd-test/UltrasonicTest";
import CoreSamplingTest from "../ntd-test/CoreSamplingTest";
import CarbonationTest from "../ntd-test/CarbonationTest";
import ChlorideTest from "../ntd-test/ChlorideTest";
import SulfateTest from "../ntd-test/SulfateTest";
import HalfCellPotentialTest from "../ntd-test/HalfCellPotentialTest";
import ConcreteCoverTest from "../ntd-test/ConcreteCoverTest";
import RebarDiameterReductionTest from "../ntd-test/RebarDiameterReductionTest";
import CrushingStrengthTest from "../ntd-test/CrushingStrengthTest";
import "../../static/NDTPage.css";

function NDTPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();

  // Initialize formData with fields for tests & images
  const [formData, setFormData] = useState({
    reboundHammerTest: null,
    ultrasonicTest: null,
    coreSamplingTest: null,
    carbonationTest: null,
    chlorideTest: null,
    sulfateTest: null,
    halfCellPotentialTest: null,
    concreteCoverTest: null,
    rebarDiameterTest: null,
    crushingStrengthTest: null,
  });

  const [imagePreviews, setImagePreviews] = useState({});
  const [error, setError] = useState("");

  // ✅ Handle Image Uploads (for multiple test images)
  const handleImageChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      const file = files[0];

      setFormData((prev) => ({
        ...prev,
        [name]: file, // Store image file
      }));

      setImagePreviews((prev) => ({
        ...prev,
        [name]: URL.createObjectURL(file), // Store preview
      }));
    }
  };

  // ✅ Collects and formats test data properly
  const prepareFormData = () => {
    const formDataToSend = new FormData();

    // ✅ Append test results (convert JSON)
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        if (typeof formData[key] === "object" && !formData[key].type) {
          formDataToSend.append(key, JSON.stringify(formData[key])); // Convert objects to JSON
        } else {
          formDataToSend.append(key, formData[key]); // Append other values
        }
      }
    });

    return formDataToSend;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    };

    try {
      const formDataToSend = prepareFormData();
      await axios.post(`http://localhost:5000/api/ndt/${auditId}`, formDataToSend, config);
      navigate(`/audit/${auditId}/conclusion`);
    } catch (err) {
      setError("Failed to submit NDT results. Please try again.");
    }
  };

  return (
    <div className="ndt-page-container">
      <h2 className="ndt-page-title">Non-Destructive Testing (NDT) Records</h2>
      {error && <p className="ndt-error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="ndt-form">
        {/* ✅ Test Components - Now pass handleImageChange & imagePreviews */}
        <ReboundHammerTest formData={formData} setFormData={setFormData} handleImageChange={handleImageChange} imagePreviews={imagePreviews} />
        <UltrasonicTest formData={formData} setFormData={setFormData} handleImageChange={handleImageChange} imagePreviews={imagePreviews} />
        <CoreSamplingTest formData={formData} setFormData={setFormData} handleImageChange={handleImageChange} imagePreviews={imagePreviews} />
        <CarbonationTest formData={formData} setFormData={setFormData} handleImageChange={handleImageChange} imagePreviews={imagePreviews} />
        <ChlorideTest formData={formData} setFormData={setFormData} handleImageChange={handleImageChange} imagePreviews={imagePreviews} />
        <SulfateTest formData={formData} setFormData={setFormData} handleImageChange={handleImageChange} imagePreviews={imagePreviews} />
        <HalfCellPotentialTest formData={formData} setFormData={setFormData} handleImageChange={handleImageChange} imagePreviews={imagePreviews} />
        <ConcreteCoverTest formData={formData} setFormData={setFormData} handleImageChange={handleImageChange} imagePreviews={imagePreviews} />
        <RebarDiameterReductionTest formData={formData} setFormData={setFormData} handleImageChange={handleImageChange} imagePreviews={imagePreviews} />
        <CrushingStrengthTest formData={formData} setFormData={setFormData} handleImageChange={handleImageChange} imagePreviews={imagePreviews} />

        <button type="submit" className="ndt-submit-btn">Save & Finish</button>
      </form>
    </div>
  );
}

export default NDTPage;
