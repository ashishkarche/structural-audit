// components/Layout.js
import React from "react";
import Sidebar from "./Sidebar";
import "../static/Layout.css";

function Layout({ children }) {
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="layout-main">{children}</main>
    </div>
  );
}

export default Layout;
