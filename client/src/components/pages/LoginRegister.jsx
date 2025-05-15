import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2.5,
          width: "100%",
          maxWidth: "400px",
          position: "relative",
        }}
      >
        <IconButton
          aria-label="back"
          onClick={() => navigate(-1)}
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: "bold", mt: 3 }}>
          Welcome to Kestral
        </Typography>
        <TextField label="Email" variant="outlined" fullWidth />
        <TextField label="Password" type="password" variant="outlined" fullWidth />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{
            borderRadius: "50px",
            p: "10px 0",
            fontWeight: "bold",
            textTransform: "none",
            fontSize: "1rem",
          }}
        >
          Log In
        </Button>
        <Box sx={{ width: "100%", display: "flex", alignItems: "center", my: 1 }}>
          <Divider sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ px: 2, color: "text.secondary" }}>
            OR
          </Typography>
          <Divider sx={{ flexGrow: 1 }} />
        </Box>
        <Typography variant="body2" sx={{ textAlign: "center" }}>
          Don't have an account?{" "}
          <Link
            href="#"
            underline="hover"
            sx={{ fontWeight: "bold", color: "secondary.main", cursor: "pointer" }}
            onClick={(e) => e.preventDefault()}
          >
            Sign up
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;
