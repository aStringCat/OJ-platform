import { Outlet } from "react-router-dom";
import SideNavigation from "./modules/SideNavigation";
import Box from "@mui/material/Box";

const App = () => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <SideNavigation />
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default App;
