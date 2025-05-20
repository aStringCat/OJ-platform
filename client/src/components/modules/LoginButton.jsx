import { Link } from "react-router-dom";
import Button from "@mui/material/Button";

const LoginButtion = () => {
  return (
    <Button component={Link} to="/login" variant="contained">
      Login
    </Button>
  );
};

export default LoginButtion;
