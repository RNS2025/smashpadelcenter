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
import { Preferences, preferenceConfig } from "../types/Preferences";

type SaveStatus = "success" | "error" | null;

interface NotificationSelectorProps {
  userId: string;
}

const NotificationSelector: React.FC<NotificationSelectorProps> = ({
  userId,
}) => {
  const [preferences, setPreferences] = useState<Preferences>(() => ({
    updates: false,
    messages: false,
    events: false,
    promotions: false,
    makkerbors: false,
    rangliste: false,
    nyheder: false,
    turneringer: false,
  }));
  const [loading, setLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ preferences: Partial<Preferences> }>(
          `/preferences/${userId}`
        );
        // Normalize API response to ensure all preference keys are present and boolean
        const fetchedPreferences = response.data.preferences || {};
        const normalizedPreferences: Preferences = {
          updates: fetchedPreferences.updates ?? false,
          messages: fetchedPreferences.messages ?? false,
          events: fetchedPreferences.events ?? false,
          promotions: fetchedPreferences.promotions ?? false,
          makkerbors: fetchedPreferences.makkerbors ?? false,
          rangliste: fetchedPreferences.rangliste ?? false,
          nyheder: fetchedPreferences.nyheder ?? false,
          turneringer: fetchedPreferences.turneringer ?? false,
        };
        setPreferences(normalizedPreferences);
      } catch (error) {
        console.error("Failed to fetch notification preferences:", error);
        setSaveStatus("error");
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
            <preferenceConfig.updates.icon size={20} />
            Notifikationer
          </Typography>
        }
      />
      <Divider />

      <CardContent>
        {(Object.keys(preferenceConfig) as Array<keyof Preferences>).map(
          (key) => {
            const { label, icon: Icon } = preferenceConfig[key];

            return (
              <Box
                key={key}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                my={2}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Icon color="#3B82F6" />
                  <Typography>{label}</Typography>
                </Box>
                <Switch
                  checked={preferences[key]}
                  onChange={() => handleToggle(key)}
                  color="primary"
                />
              </Box>
            );
          }
        )}

        <Box mt={3}>
          <Button
            variant="contained"
            fullWidth
            onClick={savePreferences}
            disabled={loading}
          >
            {loading ? "Gemmer..." : "Gem præferencer"}
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
