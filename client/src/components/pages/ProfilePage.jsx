import { useAuth } from "../../auth";
import { Navigate, useLocation } from "react-router-dom";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import BackButton from "../modules/BackButton"; // Assuming you want a back button
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge"; // For User ID

const ProfilePage = () => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Container
        sx={{
          textAlign: "center",
          mt: 5,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const getInitials = (name) => {
    if (!name) return "?";
    const nameParts = name.split(" ");
    if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name[0] ? name[0].toUpperCase() : "?";
  };

  return (
    <Container maxWidth="md" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, position: "relative" }}>
      <BackButton />
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mt: { xs: 6, sm: 0 } }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Avatar
            sx={{ width: 100, height: 100, mb: 2, bgcolor: "primary.main", fontSize: "3rem" }}
          >
            {getInitials(currentUser.name)}
          </Avatar>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
            {currentUser.name}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List>
          <ListItem>
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText primary="Email" secondary={currentUser.email || "N/A"} />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <BadgeIcon />
            </ListItemIcon>
            <ListItemText primary="User ID" secondary={currentUser._id} />
          </ListItem>
          {/* Add more profile details here as needed */}
        </List>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
