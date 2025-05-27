import { Link } from "react-router-dom";
import Button from "@mui/material/Button";

const LoginButton = () => {
  return (
    <Button
      component={Link}
      to="/login"
      variant="contained"
      color="primary"
      sx={{
        padding: "8px 20px",
        borderRadius: "8px",
        textTransform: "none",
        fontWeight: "600",
        boxShadow: "0 3px 5px 2px rgba(0, 105, 255, .2)",
        transition: "transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 5px 8px 3px rgba(0, 105, 255, .3)",
        },
        "&:active": {
          transform: "translateY(0px)",
        },
      }}
    >
      Login
    </Button>
  );
};

// Corrected export name
export default LoginButton;
