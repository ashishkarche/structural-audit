import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../static/NDTPage.css";

// ✅ Import all test components
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

function NDTPage() {
  const { auditId } = useParams();
  const navigate = useNavigate();

  // ✅ Check if already submitted
  const [isSubmitted, setIsSubmitted] = useState(
    localStorage.getItem(`ndtSubmitted_${auditId}`) === "submitted"
  );

  // ✅ Manage test data dynamically
  const initialFormData = {
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
  };
  const [formData, setFormData] = useState(initialFormData);
  const [imageData, setImageData] = useState({});
  const [error, setError] = useState("");

  // ✅ Handle Image Uploads
  const handleImageChange = (e) => {
    if (isSubmitted) return;
    const { name, files } = e.target;
    if (files.length > 0) {
      setImageData((prev) => ({
        ...prev,
        [name]: { file: files[0], preview: URL.createObjectURL(files[0]) },
      }));
    }
  };

  // ✅ Prepare form data for submission
  const prepareFormData = () => {
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      }
    });
    Object.keys(imageData).forEach((key) => {
      if (imageData[key].file) {
        formDataToSend.append(key, imageData[key].file);
      }
    });
    return formDataToSend;
  };

  // ✅ Submit Form Data
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
      await axios.post(
        `https://structural-audit.vercel.app/api/ndt/${auditId}`,
        prepareFormData(),
        config
      );
      localStorage.setItem(`ndtSubmitted_${auditId}`, "submitted");
      setIsSubmitted(true);
      navigate(`/audit/${auditId}/conclusion`);
    } catch (err) {
      setError("Failed to submit NDT results. Please try again.");
    }
  };

  // ✅ List of test components
  const testComponents = [
    { component: ReboundHammerTest, key: "reboundHammerTest" },
    { component: UltrasonicTest, key: "ultrasonicTest" },
    { component: CoreSamplingTest, key: "coreSamplingTest" },
    { component: CarbonationTest, key: "carbonationTest" },
    { component: ChlorideTest, key: "chlorideTest" },
    { component: SulfateTest, key: "sulfateTest" },
    { component: HalfCellPotentialTest, key: "halfCellPotentialTest" },
    { component: ConcreteCoverTest, key: "concreteCoverTest" },
    { component: RebarDiameterReductionTest, key: "rebarDiameterTest" },
    { component: CrushingStrengthTest, key: "crushingStrengthTest" },
  ];

  return (
    <div className="ndt-page-container">
      <h2 className="ndt-page-title">Non-Destructive Testing (NDT) Records</h2>
      {error && <p className="ndt-error-message">{error}</p>}

      {isSubmitted ? (
        <p>Your NDT records have been submitted. You can view the details below.</p>
      ) : (
        <form onSubmit={handleSubmit} className="ndt-form">
          {testComponents.map(({ component: TestComponent, key }) => (
            <TestComponent
              key={key}
              formData={formData}
              setFormData={setFormData}
              handleImageChange={handleImageChange}
              imageData={imageData}
              isSubmitted={isSubmitted}
            />
          ))}
          {!isSubmitted && <button type="submit" className="ndt-submit-btn">Save & Finish</button>}
        </form>
      )}
    </div>
  );
}

export default NDTPage;