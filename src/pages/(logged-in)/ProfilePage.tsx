import React from "react";
import { Box } from "@mui/material";
import NotificationSelector from "../../components/NotificationSelector";
import { useUser } from "../../context/UserContext";

const ProfilePage: React.FC = () => {
  const { username } = useUser(); // Get the user from context
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", my: 4, px: 2 }}>
      {/* Include the notification preference component */}
      <NotificationSelector userId={username || "unknown"} />
    </Box>
  );
};

export default ProfilePage;
