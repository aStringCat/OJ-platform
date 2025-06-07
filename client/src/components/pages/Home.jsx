// client/src/components/pages/Home.jsx

import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../auth";
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Paper,
  styled,
  Avatar,
  Link,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HistoryIcon from "@mui/icons-material/History";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GitHubIcon from "@mui/icons-material/GitHub";

// A styled Paper component for the action cards to provide a consistent, elevated look.
const ActionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  height: "100%",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[4],
  },
}));

const Home = () => {
  const { currentUser } = useAuth(); // Use auth context to check if a user is logged in

  // Action items change based on whether the user is logged in.
  const actions = currentUser
    ? [
        {
          icon: <ListAltIcon color="primary" sx={{ fontSize: 40 }} />,
          title: "Browse Problems",
          description: "Jump into the problem set and start solving.",
          link: "/problems",
        },
        {
          icon: <HistoryIcon color="primary" sx={{ fontSize: 40 }} />,
          title: "My Submissions",
          description: "Review your past submissions and track your progress.",
          link: "/submissions",
        },
      ]
    : [
        {
          icon: <ListAltIcon color="primary" sx={{ fontSize: 40 }} />,
          title: "Explore Problems",
          description: "Discover our collection of challenges for all skill levels.",
          link: "/problems",
        },
        {
          icon: <ArrowForwardIcon color="primary" sx={{ fontSize: 40 }} />,
          title: "Get Started",
          description: "Create an account or log in to save your progress and compete.",
          link: "/login",
        },
      ];

  const getInitials = (name) => {
    if (!name) return "?";
    const nameParts = name.split(" ");
    if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name[0] ? name[0].toUpperCase() : "?";
  };

  return (
    <Box
      sx={{
        backgroundColor: "#f7f9fc",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        {/* Welcome Section */}
        <Container sx={{ py: { xs: 6, md: 10 } }} maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            {currentUser && (
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mb: 2,
                  bgcolor: "primary.main",
                  margin: "0 auto",
                  fontSize: "2.5rem",
                }}
              >
                {getInitials(currentUser.name)}
              </Avatar>
            )}
            <Typography variant="h3" component="h1" sx={{ fontWeight: "bold", mb: 1 }}>
              {currentUser ? `Welcome back, ${currentUser.name}!` : "Welcome to Kestrel"}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: "600px", margin: "0 auto" }}
            >
              {currentUser
                ? "Ready to solve your next challenge? Here are some quick links to get you started."
                : "The open-source platform for practicing your coding skills. Dive into problems, get instant feedback, and grow."}
            </Typography>
          </Box>

          {/* Action Cards Section */}
          <Grid container spacing={4} justifyContent="center" columns={{ xs: 4, sm: 8, md: 12 }}>
            {actions.map((action) => (
              // By setting the `md` prop without a value, we tell the Grid items to share
              // the available space equally. This ensures they are all the same width.
              <Grid key={action.title} size={5}>
                <ActionCard elevation={2}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 2 }}>{action.icon}</Box>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: "bold", mb: 1 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      {action.description}
                    </Typography>
                  </Box>
                  <Button
                    component={RouterLink}
                    to={action.link}
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ mt: "auto", alignSelf: "flex-start" }}
                  >
                    Go
                  </Button>
                </ActionCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: "auto",
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {"Copyright © Kestrel Platform "}
              {new Date().getFullYear()}
              {"."}
            </Typography>
            <Link
              href="https://github.com/astringcat/oj-platform"
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              underline="hover"
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <GitHubIcon sx={{ fontSize: "1.2rem" }} />
              <Typography variant="body2">View on GitHub</Typography>
            </Link>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
