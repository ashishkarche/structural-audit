import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Layout from "./components/Layout";
import Loader from "./components/Loader"; // Import new loader

// Lazy Load Components
const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const SubmitAudit = lazy(() => import("./components/SubmitAudit"));
const ViewAudits = lazy(() => import("./components/ViewAudit"));
const EditProfile = lazy(() => import("./components/EditProfile"));
const AuditDetails = lazy(() => import("./components/AuditDetails"));
const EditAudit = lazy(() => import("./components/EditAudit"));
const NotFound = lazy(() => import("./components/NotFound"));

// Check Authentication
const isAuthenticated = () => !!localStorage.getItem("token");

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
};

function App() {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Hide loader after 4s
    const timer = setTimeout(() => setShowLoader(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      {showLoader ? (
        <Loader onComplete={() => setShowLoader(false)} />
      ) : (
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/submit-audit" element={<ProtectedRoute><SubmitAudit /></ProtectedRoute>} />
            <Route path="/view-audits" element={<ProtectedRoute><ViewAudits /></ProtectedRoute>} />
            <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/audit/:id" element={<ProtectedRoute><AuditDetails /></ProtectedRoute>} />
            <Route path="/edit-audit/:id" element={<ProtectedRoute><EditAudit /></ProtectedRoute>} />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      )}
    </Router>
  );
}

export default App;
