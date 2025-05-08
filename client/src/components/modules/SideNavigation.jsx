import React, { useState } from "react";

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

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
});

const closedMixin = (theme) => ({
  width: `calc(${theme.spacing(7)} + 1px)`,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
});

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  "& .MuiDrawer-paper": {
    ...closedMixin(theme),
    backgroundColor: "#EDF1F7",
    "&:hover": {
      ...openedMixin(theme),
    },
  },
}));

const navList1 = [
  { title: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { title: "Problems", icon: <ListAltIcon />, path: "/problems" },
  { title: "My Submissions", icon: <HistoryIcon />, path: "/submissions" },
  { title: "Contests", icon: <EmojiEventsIcon />, path: "/contests" },
  { title: "Standings", icon: <LeaderboardIcon />, path: "/standings" },
];

const navList2 = [
  { title: "User Profile", icon: <AccountCircleIcon />, path: "/profile" },
  { title: "Settings", icon: <SettingsIcon />, path: "/settings" },
];

const SideNavigation = () => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: "flex" }} zIndex={9}>
      <CssBaseline />
      <StyledDrawer
        variant="permanent"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <Toolbar />
        <Divider />
        <List>
          {navList1.map((context) => (
            <ListItem key={context.title} disablePadding>
              <ListItemButton component={Link} to={context.path} sx={{ px: 2.5 }}>
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : "auto", justifyContent: "center" }}>
                  {context.icon}
                </ListItemIcon>
                <ListItemText
                  primary={context.title}
                  sx={{ opacity: open ? 1 : 0, transition: "opacity 0.2s", whiteSpace: "nowrap" }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider />
          {navList2.map((context) => (
            <ListItem key={context.title} disablePadding>
              <ListItemButton sx={{ px: 2.5 }}>
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : "auto", justifyContent: "center" }}>
                  {context.icon}
                </ListItemIcon>
                <ListItemText
                  primary={context.title}
                  sx={{ opacity: open ? 1 : 0, transition: "opacity 0.2s", whiteSpace: "nowrap" }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
      </StyledDrawer>
    </Box>
  );
};

export default SideNavigation;
