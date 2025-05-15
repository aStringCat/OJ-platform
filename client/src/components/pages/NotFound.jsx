import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";

const NotFound = () => {
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <SentimentVeryDissatisfiedIcon sx={{ fontSize: 80, mb: 2, color: "text.secondary" }} />
        <Typography component="h1" variant="h3" gutterBottom sx={{ fontWeight: "bold" }}>
          404 - Page Not Found
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Oops! The page you are looking for does not exist.
        </Typography>
        <Button
          component={Link}
          to="/" // Link to your homepage or another appropriate route
          variant="contained"
          color="primary"
          sx={{ mt: 3, mb: 2 }}
        >
          Back to Homepage
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
