import { useState } from "react";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Toolbar from "@mui/material/Toolbar";
import { styled } from "@mui/material/styles";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HistoryIcon from "@mui/icons-material/History";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const drawerWidth = 240;

// ... (openedMixin, closedMixin, StyledDrawer remain the same)
const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const StyledDrawer = styled(Drawer, { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    width: drawerWidth, // Ensure width is applied even when not transitioning for initial render
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    ...(open && {
      // Apply openedMixin styles when open is true
      ...openedMixin(theme),
      "& .MuiDrawer-paper": openedMixin(theme),
    }),
    ...(!open && {
      // Apply closedMixin styles when open is false
      ...closedMixin(theme),
      "& .MuiDrawer-paper": closedMixin(theme),
    }),
    "& .MuiDrawer-paper": {
      // Common paper styles
      backgroundColor: "#EDF1F7", // Or your theme's paper background
      boxSizing: "border-box", // Ensure consistent box sizing
      ...(open ? openedMixin(theme) : closedMixin(theme)), // Apply mixins again for paper specifically
    },
  })
);

const navList1 = [
  { title: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { title: "Problems", icon: <ListAltIcon />, path: "/problems" },
  // { title: "My Submissions", icon: <HistoryIcon />, path: "/submissions" }, // Example: could be auth-dependent
  { title: "Contests", icon: <EmojiEventsIcon />, path: "/contests" },
  { title: "Standings", icon: <LeaderboardIcon />, path: "/standings" },
];

const navListActions = [
  { title: "Add Problem", icon: <AddCircleOutlineIcon />, path: "/add-problem" },
];

const navList2 = [
  { title: "User Profile", icon: <AccountCircleIcon />, path: "/profile" },
  // { title: "Settings", icon: <SettingsIcon />, path: "/settings" }, // Example
];

// Accept currentUser as a prop
const SideNavigation = ({ currentUser }) => {
  const [open, setOpen] = useState(false);

  const commonNavItems = navList1.map((context) => (
    <ListItem key={context.title} disablePadding sx={{ display: "block" }}>
      <ListItemButton
        component={Link}
        to={context.path}
        sx={{
          minHeight: 48,
          justifyContent: open ? "initial" : "center",
          px: 2.5,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 3 : "auto",
            justifyContent: "center",
          }}
        >
          {context.icon}
        </ListItemIcon>
        <ListItemText
          primary={context.title}
          sx={{ opacity: open ? 1 : 0, transition: "opacity 0.2s", whiteSpace: "nowrap" }}
        />
      </ListItemButton>
    </ListItem>
  ));

  const actionNavItems = navListActions.map((context) => (
    <ListItem key={context.title} disablePadding sx={{ display: "block" }}>
      <ListItemButton
        component={Link}
        to={context.path}
        sx={{
          minHeight: 48,
          justifyContent: open ? "initial" : "center",
          px: 2.5,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 3 : "auto",
            justifyContent: "center",
          }}
        >
          {context.icon}
        </ListItemIcon>
        <ListItemText
          primary={context.title}
          sx={{ opacity: open ? 1 : 0, transition: "opacity 0.2s", whiteSpace: "nowrap" }}
        />
      </ListItemButton>
    </ListItem>
  ));

  const userNavItems = navList2.map((context) => (
    <ListItem key={context.title} disablePadding sx={{ display: "block" }}>
      <ListItemButton
        component={Link}
        to={context.path}
        sx={{
          minHeight: 48,
          justifyContent: open ? "initial" : "center",
          px: 2.5,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 3 : "auto",
            justifyContent: "center",
          }}
        >
          {context.icon}
        </ListItemIcon>
        <ListItemText
          primary={context.title}
          sx={{ opacity: open ? 1 : 0, transition: "opacity 0.2s", whiteSpace: "nowrap" }}
        />
      </ListItemButton>
    </ListItem>
  ));

  return (
    <Box sx={{ display: "flex" }} zIndex={9}>
      {" "}
      {/* zIndex for drawer to be above content but below UserActions potentially */}
      <CssBaseline />
      <StyledDrawer
        variant="permanent"
        open={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <Toolbar /> {/* Provides spacing for content below app bar if you had one */}
        <Divider />
        <List>{commonNavItems}</List>
        {currentUser && ( // Conditionally render "Actions" section if user is logged in
          <>
            <Divider />
            <List>{actionNavItems}</List>
          </>
        )}
        <Divider />
        <List>{userNavItems}</List>
        <Divider />
      </StyledDrawer>
    </Box>
  );
};

export default SideNavigation;
