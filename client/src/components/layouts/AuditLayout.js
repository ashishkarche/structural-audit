// components/AuditLayout.js
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import AuditProgress from "../audit/AuditProgress";
import "../../static/AuditLayout.css";

const AuditLayout = () => {
  const location = useLocation();
  // If the pathname includes "/full", "/details" or "/edit", we hide the audit progress.
  const hideProgress =
    location.pathname.includes("/full") ||
    location.pathname.includes("/details") ||
    location.pathname.includes("/edit");

  return (
    <div className="audit-layout">
      {/* Render AuditProgress only if hideProgress is false */}
      {!hideProgress && <AuditProgress />}
      <div className="audit-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AuditLayout;
