import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";
import "../../static/MainLayout.css";

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="content-container">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
