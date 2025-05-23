import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import ListItemIcon from "@mui/material/ListItemIcon";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const UserActions = () => {
  const { currentUser, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally show an error message to the user using a snackbar or alert
    }
  };

  const handleProfile = () => {
    handleClose();
    navigate("/profile");
  };

  if (isLoading) {
    return <CircularProgress size={24} sx={{ color: "common.white" }} />; // Assuming a dark header, adjust color if needed
  }

  if (!currentUser) {
    return (
      <Button
        component={Link}
        to="/login"
        variant="contained"
        color="primary"
        sx={{ color: "white" }}
      >
        Login
      </Button>
    );
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
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography
        variant="subtitle1"
        sx={{ mr: 1, color: "inherit", display: { xs: "none", sm: "block" } }}
      >
        {currentUser.name}
      </Typography>
      <IconButton
        onClick={handleMenu}
        size="small"
        aria-controls={open ? "account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main", color: "white" }}>
          {getInitials(currentUser.name)}
        </Avatar>
      </IconButton>
      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "avatar-button",
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserActions;
