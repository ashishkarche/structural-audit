import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Loader from "./components/dashboard/Loader";
import ProtectedRoute from "./components/ProtectedRoute";
import TokenChecker from "./components/TokenChecker";

// Import Maintenance Page
import MaintenancePage from "./MaintenancePage"; 

// Lazy load components
const Login = lazy(() => import("./components/auth/Login"));
const Register = lazy(() => import("./components/auth/Register"));
const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));
const SubmitAudit = lazy(() => import("./components/audit/SubmitAudit"));
const ViewAudits = lazy(() => import("./components/audit/ViewAudits"));
const EditProfile = lazy(() => import("./components/profile/EditProfile"));
const AuditDetails = lazy(() => import("./components/audit/AuditDetails"));
const EditAudit = lazy(() => import("./components/audit/EditAudit"));
const StructuralChangesPage = lazy(() => import("./components/pages/StructuralChangesPage"));
const Observations = lazy(() => import("./components/pages/ObservationPage"));
const ImmediateConcern = lazy(() => import("./components/pages/ImmediateConcernPage"));
const NDTPage = lazy(() => import("./components/pages/NDTPage"));
const ViewSubmittedAudit = lazy(() => import("./components/audit/ViewSubmittedAudit"));
const NotFound = lazy(() => import("./components/pages/NotFound"));
const AuditLayout = lazy(() => import("./components/layouts/AuditLayout"));
const MainLayout = lazy(() => import("./components/layouts/MainLayout"));
const AuditHistory = lazy(() => import("./components/audit/AuditHistory"));
const ReportPage = lazy(() => import("./components/pages/ReportPage"));
const ConclusionPage = lazy(() => import("./components/audit/ConclusionPage"));
const UploadDrawings = lazy(() => import("./components/pages/UploadDrawings"));

function App() {
  const [showLoader, setShowLoader] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(true); // Toggle maintenance mode here

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Disable Right-Click
    document.addEventListener("contextmenu", (event) => event.preventDefault());

    // Disable DevTools Shortcuts
    const disableDevTools = (event) => {
      if (
        event.ctrlKey &&
        (event.key === "u" || event.key === "U" || event.key === "i" || event.key === "I" || event.key === "j" || event.key === "J" || event.key === "c" || event.key === "C")
      ) {
        event.preventDefault();
      }
      if (event.key === "F12") {
        event.preventDefault();
      }
    };
    
    document.addEventListener("keydown", disableDevTools);

    return () => {
      document.removeEventListener("contextmenu", (event) => event.preventDefault());
      document.removeEventListener("keydown", disableDevTools);
    };
  }, []);

  // Show maintenance page if maintenance mode is enabled
  if (isMaintenanceMode) {
    return <MaintenancePage />;
  }

  return (
    <Router>
      <TokenChecker />
      {showLoader ? (
        <Loader />
      ) : (
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes Wrapped in MainLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="submit-audit" element={<SubmitAudit />} />
              <Route path="view-audits" element={<ViewAudits />} />
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="/reports" element={<ReportPage />} />
              {/* Audit-Specific Routes */}
              <Route path="audit/:auditId/*" element={<AuditLayout />}>
                <Route index element={<Navigate to="upload-drawings" replace />} />
                <Route path="upload-drawings" element={<UploadDrawings />} />
                <Route path="structural-changes" element={<StructuralChangesPage />} />
                <Route path="observations" element={<Observations />} />
                <Route path="immediate-concern" element={<ImmediateConcern />} />
                <Route path="ndt-tests" element={<NDTPage />} />
                <Route path="conclusion" element={<ConclusionPage />} />
                <Route path="full" element={<ViewSubmittedAudit />} />
                <Route path="details" element={<AuditDetails />} />
                <Route path="edit" element={<EditAudit />} />
              </Route>
              <Route path="audit/:auditId/history" element={<AuditHistory />} />
            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      )}
    </Router>
  );
}

export default App;
