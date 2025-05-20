import { useNavigate, useLocation } from "react-router-dom";

import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const fromPath = location.state?.from;
    if (fromPath && fromPath !== "/login" && fromPath !== "/register") {
      navigate(fromPath, { replace: true });
    } else {
      navigate("/");
    }
  };

  return (
    <IconButton
      aria-label="back"
      onClick={handleBack}
      sx={{
        position: "absolute",
        top: 16,
        left: 16,
      }}
    >
      <ArrowBackIcon />
    </IconButton>
  );
};
export default BackButton;
