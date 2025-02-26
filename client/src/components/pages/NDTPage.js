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

  // ✅ Check if already submitted
  const [isSubmitted, setIsSubmitted] = useState(localStorage.getItem(`ndtSubmitted_${auditId}`) === "submitted");

  // ✅ Initialize formData with test fields as JSON
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

  // ✅ Separate state for images (previews & files)
  const [imageData, setImageData] = useState({});
  const [error, setError] = useState("");

  // ✅ Handle Image Uploads
  const handleImageChange = (e) => {
    if (isSubmitted) return;
    const { name, files } = e.target;
    if (files.length > 0) {
      const file = files[0];

      setImageData((prev) => ({
        ...prev,
        [name]: { file, preview: URL.createObjectURL(file) },
      }));
    }
  };

  // ✅ Prepare form data for API submission
  const prepareFormData = () => {
    const formDataToSend = new FormData();

    // ✅ Append test results (convert JSON)
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        formDataToSend.append(key, JSON.stringify(formData[key])); // Convert objects to JSON
      }
    });

    // ✅ Append image files
    Object.keys(imageData).forEach((key) => {
      if (imageData[key].file) {
        formDataToSend.append(key, imageData[key].file);
      }
    });

    return formDataToSend;
  };

  // ✅ Submit form data
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
      await axios.post(`https://structural-audit.vercel.app/api/ndt/${auditId}`, formDataToSend, config);

      // ✅ Mark as submitted
      localStorage.setItem(`ndtSubmitted_${auditId}`, "submitted");
      setIsSubmitted(true);
      navigate(`/audit/${auditId}/conclusion`);
    } catch (err) {
      setError("Failed to submit NDT results. Please try again.");
    }
  };

  return (
    <div className="ndt-page-container">
      <h2 className="ndt-page-title">Non-Destructive Testing (NDT) Records</h2>
      {error && <p className="ndt-error-message">{error}</p>}

      {isSubmitted ? (
        <p>Your NDT records have been submitted. You can view the details below.</p>
      ) : (
        <form onSubmit={handleSubmit} className="ndt-form">
          {/* ✅ Pass image handling & previews to components */}
          <ReboundHammerTest
            formData={formData}
            setFormData={setFormData}
            handleImageChange={handleImageChange}
            imageData={imageData}
            isSubmitted={isSubmitted}
          />
          <UltrasonicTest
            formData={formData}
            setFormData={setFormData}
            handleImageChange={handleImageChange}
            imageData={imageData}
            isSubmitted={isSubmitted}
          />
          <CoreSamplingTest
            formData={formData}
            setFormData={setFormData}
            handleImageChange={handleImageChange}
            imageData={imageData}
            isSubmitted={isSubmitted}
          />
          <CarbonationTest
            formData={formData}
            setFormData={setFormData}
            handleImageChange={handleImageChange}
            imageData={imageData}
            isSubmitted={isSubmitted}
          />
          <ChlorideTest
            formData={formData}
            setFormData={setFormData}
            handleImageChange={handleImageChange}
            imageData={imageData}
            isSubmitted={isSubmitted}
          />
          <SulfateTest
            formData={formData}
            setFormData={setFormData}
            handleImageChange={handleImageChange}
            imageData={imageData}
            isSubmitted={isSubmitted}
          />
          <HalfCellPotentialTest
            formData={formData}
            setFormData={setFormData}
            handleImageChange={handleImageChange}
            imageData={imageData}
            isSubmitted={isSubmitted}
          />
          <ConcreteCoverTest
            formData={formData}
            setFormData={setFormData}
            handleImageChange={handleImageChange}
            imageData={imageData}
            isSubmitted={isSubmitted}
          />
          <RebarDiameterReductionTest
            formData={formData}
            setFormData={setFormData}
            handleImageChange={handleImageChange}
            imageData={imageData}
            isSubmitted={isSubmitted}
          />
          <CrushingStrengthTest
            formData={formData}
            setFormData={setFormData}
            handleImageChange={handleImageChange}
            imageData={imageData}
            isSubmitted={isSubmitted}
          />

          {!isSubmitted && <button type="submit" className="ndt-submit-btn">Save & Finish</button>}
        </form>
      )}
    </div>
  );
}

export default NDTPage;
