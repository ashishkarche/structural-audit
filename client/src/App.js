// App.js
import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Loader from "./components/Loader";
import ProtectedRoute from "./components/ProtectedRoute"; 

// Lazy load components
const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const SubmitAudit = lazy(() => import("./components/SubmitAudit"));
const ViewAudits = lazy(() => import("./components/ViewAudits"));
const EditProfile = lazy(() => import("./components/EditProfile"));
const AuditDetails = lazy(() => import("./components/AuditDetails"));
const EditAudit = lazy(() => import("./components/EditAudit"));
const StructuralChangesPage = lazy(() => import("./components/StructuralChangesPage"));
const Observations = lazy(() => import("./components/ObservationPage"));
const ImmediateConcern = lazy(() => import("./components/ImmediateConcernPage"));
const NDTPage = lazy(() => import("./components/NDTPage"));
const ViewSubmittedAudit = lazy(() => import("./components/ViewSubmittedAudit"));
const NotFound = lazy(() => import("./components/NotFound"));
const AuditLayout = lazy(() => import("./components/AuditLayout"));
const MainLayout = lazy(() => import("./components/MainLayout")); 

function App() {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 3000); 
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
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

              {/* Audit-Specific Routes nested inside MainLayout */}
              <Route path="audit/:auditId/*" element={<AuditLayout />}>
                <Route index element={<Navigate to="structural-changes" replace />} />
                <Route path="structural-changes" element={<StructuralChangesPage />} />
                <Route path="observations" element={<Observations />} />
                <Route path="immediate-concern" element={<ImmediateConcern />} />
                <Route path="ndt-tests" element={<NDTPage />} />
                <Route path="full" element={<ViewSubmittedAudit />} />
                <Route path="details" element={<AuditDetails />} />
                <Route path="edit" element={<EditAudit />} />
              </Route>
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
