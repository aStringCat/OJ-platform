import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth";
import BackButton from "../modules/BackButton";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert"; // For displaying errors
import CircularProgress from "@mui/material/CircularProgress";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Default to dashboard after login, or to the 'from' location if redirected
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg || err.message || "Failed to login. Please check your credentials.";
      setError(errorMsg);
      // console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
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
          gap: 2, // Adjusted gap
          width: "100%",
          maxWidth: "400px",
          position: "relative",
        }}
      >
        <BackButton />
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: "bold", mt: 3 }}>
          Welcome to Kestrel
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 1 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          autoComplete="email"
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          sx={{
            borderRadius: "50px",
            p: "10px 0",
            fontWeight: "bold",
            textTransform: "none",
            fontSize: "1rem",
            mt: 1,
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Log In"}
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
            to="/register"
            state={{ from: location.state?.from }}
            style={{ textDecoration: "none" }}
          >
            <Typography
              component="span"
              sx={{
                fontWeight: "bold",
                color: "secondary.main", // Ensure your theme has secondary.main
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Sign up
            </Typography>
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg ||
        err.message ||
        "Failed to register. The email might already be in use.";
      setError(errorMsg);
      // console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
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
          gap: 2, // Adjusted gap
          width: "100%",
          maxWidth: "400px",
          position: "relative",
        }}
      >
        <BackButton />
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: "bold", mt: 3 }}>
          Create Account
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 1 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
        <TextField
          label="Email"
          type="email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <TextField
          label="Confirm Password"
          type="password"
          variant="outlined"
          fullWidth
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          sx={{
            borderRadius: "50px",
            p: "10px 0",
            fontWeight: "bold",
            textTransform: "none",
            fontSize: "1rem",
            mt: 1,
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
        </Button>
        <Typography variant="body2" sx={{ textAlign: "center", mt: 2 }}>
          Already have an account?{" "}
          <Link
            to="/login"
            state={{ from: location.state?.from }}
            style={{ textDecoration: "none" }}
          >
            <Typography
              component="span"
              sx={{
                fontWeight: "bold",
                color: "secondary.main", // Ensure your theme has secondary.main
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Log In
            </Typography>
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};
