import { useNavigate, useLocation } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Tooltip from "@mui/material/Tooltip"; // Optional: for better UX

const BackButton = ({ sx }) => {
  // Accept sx prop for custom styling
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Preserve the 'from' state if it exists and is not a login/register page,
    // otherwise, navigate to a sensible default like dashboard or problems list.
    const fromPath = location.state?.from?.pathname;
    const previousLocation = location.state?.from;

    if (previousLocation && fromPath && fromPath !== "/login" && fromPath !== "/register") {
      navigate(fromPath, { state: location.state?.from?.state, replace: true }); // Pass along nested state
    } else if (document.referrer && !document.referrer.includes(window.location.host)) {
      // If came from an external site, maybe go to homepage
      navigate("/");
    } else if (window.history.length > 2) {
      // Check if there's a page to go back to in history
      navigate(-1); // Go to the previous page in browser history
    } else {
      navigate("/problems"); // Fallback to a general page like problems or dashboard
    }
  };

  return (
    <Tooltip title="Go Back">
      <IconButton
        aria-label="back"
        onClick={handleBack}
        sx={{
          position: "absolute",
          top: { xs: 12, sm: 16 }, // Adjusted for different screen sizes
          left: { xs: 12, sm: 16 },
          zIndex: 10, // Ensure it's above other elements if needed
          backgroundColor: "rgba(255, 255, 255, 0.5)", // Slight background for visibility
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.8)",
          },
          ...sx, // Allow overriding styles
        }}
      >
        <ArrowBackIcon />
      </IconButton>
    </Tooltip>
  );
};
export default BackButton;
