// src/layouts/MainLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom"; // Import Outlet
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Box, Toolbar } from "@mui/material";

const drawerWidth = 240; // Should match the width defined in Sidebar.jsx

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar handleDrawerToggle={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar /> {/* This is to offset the AppBar */}
        <Outlet /> {/* Render nested routes here */}
      </Box>
    </Box>
  );
};

export default MainLayout;
