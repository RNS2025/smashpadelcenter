import React, { useEffect, useState } from "react";
import { getAvailableCourtTimes } from "../services/bookingSystemService";
import CourtData from "../types/CourtData";
import CourtTime from "../types/CourtTime";
import {
  CircularProgress,
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
import { Calendar, CheckCircle, XCircle, Clock, Circle } from "lucide-react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const CourtSchedule: React.FC = () => {
  const [courtTimes, setCourtTimes] = useState<CourtData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string>(""); // Track selected start time
  const [endTime, setEndTime] = useState<string>(""); // Track selected end time
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set()); // Store selected times
  const [filterOption, setFilterOption] = useState<string>("available"); // Filter option: 'available' or 'all'

  // Fetch available court times
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAvailableCourtTimes();
        setCourtTimes(data);
      } catch {
        setError("Fejl ved hentning af tider.");
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

  // Handle filter option change
  const handleFilterOptionChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setFilterOption(event.target.value as string);
    setSelectedTimes(new Set()); // Reset selected times when changing filter option
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
          shouldShowTime(time)
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
      let notificationMessage = "Notification for Selected Court Times:\n";
      courtTimes?.forEach((court) => {
        // Filter available times for the court within the selected range, and exclude labels
        const availableTimes = court.tider.filter(
          (time) =>
            time.tid >= startTime &&
            time.tid <= endTime &&
            selectedTimes.has(time.tid) &&
            !isLabel(time.tid) // Exclude labels
        );

        if (availableTimes.length > 0) {
          notificationMessage += `\nCourt: ${court.bane}\n`;
          availableTimes.forEach((time) => {
            notificationMessage += `  - ${time.tid}\n`;
          });
        }
      });

      // Display the formatted notification
      alert(notificationMessage);
    } else {
      alert("Please select at least one time slot.");
    }
  };

  // Function to check if a time is a label (time should have at least 4 numbers)
  const isLabel = (time: string) => {
    const numberCount = (time.match(/\d/g) || []).length; // Count the number of digits in the time string
    return numberCount < 4; // If there are fewer than 4 numbers, treat it as a label
  };

  // Function to clean the time string by removing letters only (allow symbols)
  const cleanTime = (time: string) => {
    return time.replace(/[a-zA-Z]/g, ""); // Remove letters only, keep symbols intact
  };

  // Determine whether to show the time based on the filter option
  const shouldShowTime = (time: CourtTime) => {
    if (filterOption === "available") {
      return time.status === "Ledig"; // Only show available times
    }
    return true; // Show all times (available and non-available)
  };

  // Get unique times across all courts (filtered to exclude labels)
  const allTimes = courtTimes
    ? courtTimes
        .flatMap((court) => court.tider)
        .map((time) => time.tid)
        .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
        .filter((time) => !isLabel(time)) // Exclude labels
    : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <Calendar size={24} style={{ marginRight: 8 }} />
        Tilgængelige Tider per Bane
      </Typography>

      {/* Filter Option Selection (Show available or all times) */}
      <Box display="flex" justifyContent="center" mb={3} gap={2}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="filter-option-label">Show</InputLabel>
          <Select
            labelId="filter-option-label"
            value={filterOption}
            onChange={handleFilterOptionChange}
            label="Show"
          >
            <MenuItem value="available">Only Available Times</MenuItem>
            <MenuItem value="all">All Times</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Start Time and End Time selection */}
      <Box display="flex" justifyContent="center" mb={3} gap={2}>
        {/* Start Time Selection */}
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="start-time-label">Start Time</InputLabel>
          <Select
            labelId="start-time-label"
            value={startTime}
            onChange={handleStartTimeChange}
            label="Start Time"
          >
            {allTimes.map((timeslot) => (
              <MenuItem key={timeslot} value={timeslot}>
                {cleanTime(timeslot)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* End Time Selection */}
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="end-time-label">End Time</InputLabel>
          <Select
            labelId="end-time-label"
            value={endTime}
            onChange={handleEndTimeChange}
            label="End Time"
            disabled={!startTime} // Disable until start time is selected
          >
            {allTimes
              .filter((time) => time > startTime) // Only show times greater than the selected start time
              .map((timeslot) => (
                <MenuItem key={timeslot} value={timeslot}>
                  {cleanTime(timeslot)}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Box>

      {/* Render the Court names as separate sections (each as a dropdown) */}
      {courtTimes && courtTimes.length > 0 ? (
        <Box>
          {/* Render the time slots for each court */}
          {courtTimes.map((court) => (
            <Accordion key={court.bane}>
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
                  {/* Render the time slots for each court, filtering by the selected start and end times, and excluding labels */}
                  {court.tider
                    .filter(
                      (time) =>
                        time.tid >= startTime &&
                        time.tid <= endTime &&
                        shouldShowTime(time) && // Apply the selected filter option
                        !isLabel(time.tid) // Exclude labels
                    )
                    .map((time: CourtTime) => {
                      const status = time.status;
                      const isSelected = selectedTimes.has(time.tid); // Check if the time is selected
                      return (
                        <Grid item xs={4} key={time.tid}>
                          <Paper
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: 2,
                              backgroundColor:
                                status === "Ledig"
                                  ? "green"
                                  : status === "Reserveret"
                                  ? "red"
                                  : "gray",
                              color: "white",
                              borderRadius: 1,
                              position: "relative",
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
                              {status === "Ledig" ? (
                                <CheckCircle size={20} />
                              ) : status === "Reserveret" ? (
                                <XCircle size={20} />
                              ) : (
                                <Clock size={20} />
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      );
                    })}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        <Typography variant="h6" align="center" color="textSecondary">
          No court times available.
        </Typography>
      )}

      {/* Send notification button */}
      <Box mt={2} display="flex" justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendNotification}
          disabled={selectedTimes.size === 0} // Disable if no times are selected
        >
          Send Notification
        </Button>
      </Box>
    </Box>
  );
};

export default CourtSchedule;
