import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import NotificationSelector from "../NotificationSelector";
import { Bell } from "lucide-react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Popper,
  Paper,
  ClickAwayListener,
  Typography,
  Stack,
} from "@mui/material";

const HomeBar = () => {
  const { role, logout, username } = useUser();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleToggle = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleHomeClick = () => {
    navigate("/home");
  };

  const handleAdminClick = () => {
    navigate("/admin");
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* Left side: Navigation buttons */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="text" onClick={handleHomeClick}>
            Hjem
          </Button>
          {role === "admin" && (
            <Button variant="text" onClick={handleAdminClick}>
              Admin Panel
            </Button>
          )}
        </Stack>

        {/* Right side: Username and bell icon */}
        <Stack direction="row" spacing={2} alignItems="center">
          {username && (
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {username}
            </Typography>
          )}
          <IconButton onClick={handleToggle} size="large">
            <Bell />
          </IconButton>
          <Button variant="text" onClick={handleLogout}>
            Log ud
          </Button>
        </Stack>
      </Toolbar>

      {/* Notification dropdown */}
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-end"
        style={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper elevation={6} sx={{ mt: 1, width: 380, p: 2 }}>
            <NotificationSelector userId={username || ""} />
          </Paper>
        </ClickAwayListener>
      </Popper>
    </AppBar>
  );
};

export default HomeBar;
