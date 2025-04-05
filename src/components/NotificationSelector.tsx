import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Switch,
  Typography,
} from "@mui/material";
import api from "../api/api";
import { Bell } from "lucide-react";
import { Preferences, preferenceConfig } from "../types/Preferences"; // Import the preference configuration

type SaveStatus = "success" | "error" | null;

interface NotificationSelectorProps {
  userId: string;
}

const NotificationSelector: React.FC<NotificationSelectorProps> = ({
  userId,
}) => {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    return Object.fromEntries(
      Object.keys(preferenceConfig).map((key) => [key, false])
    ) as Preferences;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/preferences/${userId}`);
        setPreferences(response.data.preferences);
      } catch (error) {
        console.error("Failed to fetch notification preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPreferences();
    }
  }, [userId]);

  const handleToggle = (category: keyof Preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const savePreferences = async () => {
    try {
      setLoading(true);
      setSaveStatus(null);

      await api.post("/preferences", {
        userId,
        preferences,
      });

      setSaveStatus("success");
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
      setSaveStatus("error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };

  return (
    <Card sx={{ maxWidth: 400, mx: "auto", p: 2 }}>
      <CardHeader
        title={
          <Typography
            variant="h6"
            component="div"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Bell size={20} />
            Notification Preferences
          </Typography>
        }
      />
      <Divider />

      <CardContent>
        {Object.keys(preferenceConfig).map((key) => {
          const preferenceKey = key as keyof Preferences;
          const { label, icon: Icon } = preferenceConfig[preferenceKey]; // Retrieve from config

          return (
            <Box
              key={preferenceKey}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              my={2}
            >
              <Box display="flex" alignItems="center" gap={1}>
                {/* Here, call the icon component to render it */}
                <Icon color="#3B82F6" />
                <Typography>{label}</Typography>
              </Box>
              <Switch
                checked={preferences[preferenceKey]}
                onChange={() => handleToggle(preferenceKey)}
                color="primary"
              />
            </Box>
          );
        })}

        <Box mt={3}>
          <Button
            variant="contained"
            fullWidth
            onClick={savePreferences}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Preferences"}
          </Button>

          {saveStatus === "success" && (
            <Typography
              color="success.main"
              variant="body2"
              align="center"
              mt={1}
            >
              Preferences saved successfully!
            </Typography>
          )}

          {saveStatus === "error" && (
            <Typography
              color="error.main"
              variant="body2"
              align="center"
              mt={1}
            >
              Failed to save preferences. Please try again.
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationSelector;
