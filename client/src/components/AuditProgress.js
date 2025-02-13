// components/AuditProgress.js
import React from "react";
import { NavLink, useParams } from "react-router-dom";
import '../static/AuditProgress.css';

const steps = [
  { path: "structural-changes", label: "Structural Changes" },
  { path: "observations", label: "Observations" },
  { path: "immediate-concern", label: "Immediate Concern" },
  { path: "ndt-tests", label: "NDT Tests" },
  { path: "details", label: "Audit Details" },
];

const AuditProgress = () => {
  const { auditId } = useParams();

  return (
    <div className="audit-progress-container">
      <div className="progress-steps">
        {steps.map((step, index) => (
          <NavLink
            key={step.path}
            to={`/audit/${auditId}/${step.path}`}
            className={({ isActive }) => `step ${isActive ? "active" : ""}`}
          >
            <span className="step-number">{index + 1}</span>
            <span className="step-label">{step.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default AuditProgress;
