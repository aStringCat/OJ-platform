import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";

import SideNavigation from "./modules/SideNavigation";
import Box from "@mui/material/Box";

const App = () => {
  useEffect(() => {}, []);

  return (
    <Box sx={{ display: "flex" }}>
      <SideNavigation />
      <div className="App-container">
        <Outlet />
      </div>
    </Box>
  );
};

export default App;
