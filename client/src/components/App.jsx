import { Outlet } from "react-router-dom";
import UserActions from "./modules/UserActions"; // Import UserActions
import SideNavigation from "./modules/SideNavigation";
import Box from "@mui/material/Box";
import { useAuth } from "../auth"; // Import useAuth
import CircularProgress from "@mui/material/CircularProgress";

const App = () => {
  const { currentUser, isLoading } = useAuth();

  // Optional: Global loading state while auth is being checked
  if (isLoading) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <SideNavigation currentUser={currentUser} /> {/* Pass currentUser to SideNavigation */}
      <Box sx={{ flexGrow: 1, overflow: "auto", position: "relative" }}>
        {/* Position UserActions (top right) */}
        <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 1100 }}>
          {" "}
          {/* Ensure it's above other content */}
          <UserActions />
        </Box>
        <Outlet /> {/* Child routes will be rendered here */}
      </Box>
    </Box>
  );
};

export default App;
