import { Outlet } from "react-router-dom";
import LoginButtion from "./modules/LoginButton";
import SideNavigation from "./modules/SideNavigation";
import Box from "@mui/material/Box";

const App = () => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <SideNavigation />
      <Box sx={{ flexGrow: 1, overflow: "auto", position: "relative" }}>
        <Box sx={{ position: "absolute", top: 8, right: 16 }}>
          <LoginButtion />
        </Box>
        <Outlet />
      </Box>
    </Box>
  );
};

export default App;
