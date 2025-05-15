import { Outlet, Link } from "react-router-dom";
import SideNavigation from "./modules/SideNavigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

const App = () => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <SideNavigation />
      <Box sx={{ flexGrow: 1, overflow: "auto", position: "relative" }}>
        <Box sx={{ position: "absolute", top: 8, right: 16 }}>
          <Button component={Link} to="/login" variant="contained">
            Login
          </Button>
        </Box>
        <Outlet />
      </Box>
    </Box>
  );
};

export default App;
