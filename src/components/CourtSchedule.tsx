import React, { useEffect, useState } from "react";
import { getAvailableCourtTimes } from "../services/bookingSystemService";
import CourtData from "../types/CourtData";
import CourtTime from "../types/CourtTime";
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Calendar, CheckCircle, Circle } from "lucide-react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { sendNotification } from "../utils/notifications";
import { useUser } from "../context/UserContext";

const CourtSchedule: React.FC = () => {
  const { user } = useUser(); // Get user from user context
  const [courtTimes, setCourtTimes] = useState<CourtData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string>(""); // Track selected start time
  const [endTime, setEndTime] = useState<string>(""); // Track selected end time
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set()); // Store selected times
  const [expanded, setExpanded] = useState<Record<string, boolean>>({}); // Track expanded state of accordions

  // Fetch available court times
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAvailableCourtTimes();
        setCourtTimes(data);
      } catch (err) {
        setError("Fejl ved hentning af tider.");
        console.error("Error fetching court times:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle start time selection
  const handleStartTimeChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setStartTime(event.target.value as string);
    setSelectedTimes(new Set()); // Reset selected times when changing start time
  };

  // Handle end time selection
  const handleEndTimeChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setEndTime(event.target.value as string);
    setSelectedTimes(new Set()); // Reset selected times when changing end time
  };

  // Handle time slot selection
  const handleSelectTime = (time: CourtTime) => {
    const newSelectedTimes = new Set(selectedTimes);
    if (newSelectedTimes.has(time.tid)) {
      newSelectedTimes.delete(time.tid); // Deselect if already selected
    } else {
      newSelectedTimes.add(time.tid); // Select the time
    }
    setSelectedTimes(newSelectedTimes); // Update the selected times
  };

  // Handle selecting all available times for the selected time range across all courts
  const handleSelectAllTimes = () => {
    const newSelectedTimes = new Set<string>();
    courtTimes?.forEach((court) => {
      court.tider.forEach((time) => {
        if (
          time.tid >= startTime &&
          time.tid <= endTime &&
          time.status === "Ledig" &&
          !isLabel(time.tid)
        ) {
          newSelectedTimes.add(time.tid); // Select all available times for this range
        }
      });
    });
    setSelectedTimes(newSelectedTimes); // Update the selected times
  };

  // Handle send notification
  const handleSendNotification = () => {
    if (selectedTimes.size > 0) {
      try {
        let notificationMessage = "Selected Court Times Available:\n";
        courtTimes?.forEach((court) => {
          const availableTimes = court.tider.filter(
            (time) =>
              time.tid >= startTime &&
              time.tid <= endTime &&
              selectedTimes.has(time.tid) &&
              !isLabel(time.tid)
          );

          if (availableTimes.length > 0) {
            notificationMessage += `\nCourt: ${court.bane}\n`;
            availableTimes.forEach((time) => {
              notificationMessage += `  - ${time.tid}\n`;
            });
          }
        });

        sendNotification(
          user?.username || "Unknown",
          "Available Court Times",
          notificationMessage,
          "general"
        );
      } catch (err) {
        console.error("Error in handleSendNotification:", err);
        alert("An error occurred while sending notification.");
      }
    } else {
      alert("Please select at least one time slot.");
    }
  };

  // Function to check if a time is a label
  const isLabel = (time: string) => {
    const numberCount = (time.match(/\d/g) || []).length;
    return numberCount < 4;
  };

  // Function to clean the time string by removing letters
  const cleanTime = (time: string) => {
    return time.replace(/[a-zA-Z]/g, "");
  };

  // Handle expanding/collapsing all accordions
  const handleToggleAll = () => {
    const allExpanded = courtTimes?.every((court) => expanded[court.bane]);
    const newExpanded = {};
    courtTimes?.forEach((court) => {
      newExpanded[court.bane] = !allExpanded; // Expand if any collapsed, collapse if all expanded
    });
    setExpanded(newExpanded);
  };

  // Handle individual accordion expansion
  const handleAccordionChange =
    (bane: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded((prev) => ({ ...prev, [bane]: isExpanded }));
    };

  // Get unique AVAILABLE times across all courts
  const allAvailableTimes = courtTimes
    ? courtTimes
        .flatMap((court) => court.tider)
        .filter((time) => time.status === "Ledig")
        .map((time) => time.tid)
        .filter((value, index, self) => self.indexOf(value) === index)
        .filter((time) => !isLabel(time))
        .sort()
    : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <Calendar size={24} style={{ marginRight: 8 }} />
        Available Court Times
      </Typography>

      {/* Start Time and End Time selection */}
      <Box display="flex" justifyContent="center" mb={3} gap={2}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="start-time-label">Start Time</InputLabel>
          <Select
            labelId="start-time-label"
            value={startTime}
            onChange={handleStartTimeChange}
            label="Start Time"
          >
            {allAvailableTimes.map((timeslot) => (
              <MenuItem key={timeslot} value={timeslot}>
                {cleanTime(timeslot)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="end-time-label">End Time</InputLabel>
          <Select
            labelId="end-time-label"
            value={endTime}
            onChange={handleEndTimeChange}
            label="End Time"
            disabled={!startTime}
          >
            {allAvailableTimes
              .filter((time) => time > startTime)
              .map((timeslot) => (
                <MenuItem key={timeslot} value={timeslot}>
                  {cleanTime(timeslot)}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Box>

      {/* Render Court Times */}
      {loading ? (
        <Typography variant="h6" align="center">
          Loading...
        </Typography>
      ) : error ? (
        <Typography variant="h6" align="center" color="error">
          {error}
        </Typography>
      ) : courtTimes && courtTimes.length > 0 ? (
        <Box>
          {/* Button to expand/collapse all court dropdowns */}
          <Button variant="outlined" onClick={handleToggleAll} sx={{ mb: 2 }}>
            {courtTimes.every((court) => expanded[court.bane])
              ? "Collapse All Courts"
              : "Expand All Courts"}
          </Button>

          {/* Render the time slots for each court */}
          {courtTimes.map((court) => {
            // Filter to check if this court has any available times in the selected range
            const hasAvailableTimes = court.tider.some(
              (time) =>
                time.status === "Ledig" &&
                time.tid >= startTime &&
                time.tid <= endTime &&
                !isLabel(time.tid)
            );

            // Only render courts with available times
            if (!hasAvailableTimes && startTime && endTime) {
              return null;
            }

            return (
              <Accordion
                key={court.bane}
                expanded={expanded[court.bane] || false}
                onChange={handleAccordionChange(court.bane)}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`${court.bane}-content`}
                  id={`${court.bane}-header`}
                >
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {court.bane}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {court.tider
                      .filter(
                        (time) =>
                          time.tid >= startTime &&
                          time.tid <= endTime &&
                          time.status === "Ledig" &&
                          !isLabel(time.tid)
                      )
                      .map((time: CourtTime) => {
                        const isSelected = selectedTimes.has(time.tid);
                        return (
                          <Grid item xs={4} key={time.tid}>
                            <Paper
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: 2,
                                backgroundColor: "green",
                                color: "white",
                                borderRadius: 1,
                                position: "relative",
                                cursor: "pointer",
                                border: isSelected
                                  ? "2px solid yellow"
                                  : "none",
                              }}
                              onClick={() => handleSelectTime(time)}
                            >
                              <Typography sx={{ fontWeight: "bold" }}>
                                {time.tid}
                              </Typography>
                              {isSelected && (
                                <Circle
                                  size={12}
                                  color="yellow"
                                  style={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                  }}
                                />
                              )}
                              <Box display="flex" alignItems="center">
                                <CheckCircle size={20} />
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      ) : (
        <Typography variant="h6" align="center" color="textSecondary">
          No available court times found.
        </Typography>
      )}

      {/* Send notification and Select All buttons */}
      {/* Only show for admins */}
      {user?.role === "admin" && (
        <Box mt={2} display="flex" justifyContent="center" gap={2}>
          {/* Buttons for sending notifications and selecting all times */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendNotification}
            disabled={selectedTimes.size === 0}
          >
            Send Notification
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleSelectAllTimes}
            disabled={!startTime || !endTime}
          >
            Select All Available Times
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CourtSchedule;
