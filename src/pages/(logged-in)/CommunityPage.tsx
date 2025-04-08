import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Paper,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import AddIcon from "@mui/icons-material/Add";
import { useUser } from "../../context/UserContext";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import da from "date-fns/locale/da";
import communityApi from "../../services/communityService";
import { PadelMatch } from "../../types/PadelMatch";
import SpotInfo from "../../types/SpotInfo";

const CommunityPage: React.FC = () => {
  const { username } = useUser();
  const [matches, setMatches] = useState<PadelMatch[]>([]);
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<number>(1.0);
  const [matchDateTime, setMatchDateTime] = useState<Date | null>(null);
  const [courtBooked, setCourtBooked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const data = await communityApi.getMatches();
      setMatches(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError("Failed to load matches");
      setLoading(false);
    }
  };

  const handleCreateMatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username) {
      alert("You must be logged in to create a match");
      return;
    }
    if (!matchDateTime) {
      alert("Please select a date and time for the match");
      return;
    }

    if (matchDateTime < new Date()) {
      alert("Match date and time must be in the future");
      return;
    }

    try {
      const newMatch = {
        username,
        title: "Padel Match Request",
        description,
        level,
        participants: [username],
        joinRequests: [],
        reservedSpots: [0],
        totalSpots: 4,
        createdAt: new Date().toISOString(),
        matchDateTime: matchDateTime.toISOString(),
        courtBooked,
      };
      await communityApi.createMatch(newMatch);
      setDescription("");
      setLevel(1.0);
      setMatchDateTime(null);
      setCourtBooked(false);
      fetchMatches();
    } catch (err) {
      console.error("Error creating match:", err);
      alert("Failed to create match");
    }
  };

  const handleJoinMatch = async (matchId: number) => {
    if (!matchId) {
      console.error("Cannot join match: matchId is undefined");
      return;
    }

    try {
      if (username) {
        await communityApi.joinMatch(matchId, username);
      } else {
        console.error("Cannot join match: username is null");
      }
    } catch (error) {
      console.error("Error joining match:", error);
    }
  };

  // Usage in JSX (example):
  // Ensure 'match' is defined in the appropriate context
  {
    matches.map((match) => (
      <Button key={match.id} onClick={() => handleJoinMatch(match.id)}>
        Join
      </Button>
    ));
  }

  const handleConfirmJoin = async (matchId: number, requesterId: string) => {
    try {
      await communityApi.confirmJoin(matchId, requesterId);
      fetchMatches();
    } catch (err) {
      console.error("Error confirming join:", err);
      alert("Failed to confirm join request");
    }
  };

  const handleDeleteMatch = async (matchId: number) => {
    try {
      await communityApi.deleteMatch(matchId);
      setDeleteConfirmId(null);
      fetchMatches();
    } catch (err) {
      console.error("Error deleting match:", err);
      alert("Failed to delete match");
    }
  };

  const toggleReserveSpot = async (
    matchId: number,
    spotIndex: number,
    currentlyReserved: boolean
  ) => {
    try {
      await communityApi.reserveSpots(matchId, spotIndex, !currentlyReserved);
      fetchMatches();
    } catch (err) {
      console.error("Error toggling spot reservation:", err);
      alert("Failed to update spot reservation");
    }
  };

  const getSpotInfoForMatch = (match: PadelMatch): SpotInfo[] => {
    const spots: SpotInfo[] = Array(4)
      .fill(null)
      .map((_, index) => ({
        status: "available",
        spotIndex: index,
      }));

    spots[0] = {
      status: match.username === username ? "match owner" : "occupied",
      username: match.username,
      spotIndex: 0,
    };

    const otherParticipants = match.participants.filter(
      (p) => p !== match.username
    );
    otherParticipants.forEach((participantId, idx) => {
      if (idx + 1 < 4) {
        spots[idx + 1] = {
          status: participantId === username ? "match owner" : "occupied",
          username: participantId,
          spotIndex: idx + 1,
        };
      }
    });

    const reservedSpots = Array.isArray(match.reservedSpots)
      ? match.reservedSpots
      : [];
    reservedSpots.forEach((spotIndex) => {
      if (
        spotIndex > 0 &&
        spotIndex < 4 &&
        spots[spotIndex].status === "available"
      ) {
        spots[spotIndex] = {
          status: "reserved",
          spotIndex,
        };
      }
    });

    return spots;
  };

  const joinedMatches = matches.filter((match) =>
    match.participants.includes(username || "")
  );

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  const myMatches = matches.filter((match) => match.username === username);
  const allMatches = matches;

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Community Page
      </Typography>

      {/* Form to Create a Match */}
      <Box mb={4} component={Paper} elevation={2} p={3}>
        <Typography variant="h5" gutterBottom>
          Request a Padel Match
        </Typography>
        <form onSubmit={handleCreateMatch}>
          <Grid container spacing={2}>
            <Grid xs={12}>
              <TextField
                label="Description (e.g., location, players needed)"
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Skill Level</InputLabel>
                <Select
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  label="Skill Level"
                  required
                >
                  {Array.from({ length: 13 }, (_, i) => 1.0 + i * 0.5).map(
                    (lvl) => (
                      <MenuItem key={lvl} value={lvl}>
                        {lvl.toFixed(1)}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6}>
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={da}
              >
                <DateTimePicker
                  label="Match Date and Time"
                  value={matchDateTime}
                  onChange={(newValue) => setMatchDateTime(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                  minDateTime={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            <Grid xs={12}>
              <FormControl fullWidth>
                <InputLabel>Court Status</InputLabel>
                <Select
                  value={courtBooked ? "booked" : "notBooked"}
                  onChange={(e) => setCourtBooked(e.target.value === "booked")}
                  label="Court Status"
                >
                  <MenuItem value="booked">Court Booked</MenuItem>
                  <MenuItem value="notBooked">Court Not Booked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" color="primary" type="submit">
                Create Match
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>

      {/* Calendar Overview of Joined Matches */}
      <Typography variant="h5" gutterBottom>
        My Match Calendar
      </Typography>
      <Box mb={4}>
        {joinedMatches.length === 0 ? (
          <Alert severity="info">You haven't joined any matches yet.</Alert>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Court Status</TableCell>
                <TableCell>Participants</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {joinedMatches
                .sort(
                  (a, b) =>
                    new Date(a.matchDateTime).getTime() -
                    new Date(b.matchDateTime).getTime()
                )
                .map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      {new Date(match.matchDateTime).toLocaleString("da-DK", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </TableCell>
                    <TableCell>{match.description}</TableCell>
                    <TableCell>{match.level.toFixed(1)}</TableCell>
                    <TableCell>
                      {match.courtBooked ? "Booked" : "Not Booked"}
                    </TableCell>
                    <TableCell>{match.participants.join(", ")}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* My Matches */}
      <Typography variant="h5" gutterBottom>
        My Matches
      </Typography>
      <Box sx={{ mb: 4 }}>
        {myMatches.length === 0 ? (
          <Alert severity="info">You haven't created any matches yet.</Alert>
        ) : (
          myMatches.map((match) => (
            <Card
              key={match.id}
              sx={{ mb: 3, position: "relative" }}
              elevation={3}
            >
              <Box sx={{ position: "absolute", top: 10, right: 10 }}>
                <IconButton
                  color="error"
                  onClick={() => setDeleteConfirmId(match.id)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <CardContent sx={{ pb: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {match.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Created on {new Date(match.createdAt).toLocaleDateString()} |
                  Match scheduled:{" "}
                  {new Date(match.matchDateTime).toLocaleString()} | Level:{" "}
                  {match.level.toFixed(1)} | Court:{" "}
                  {match.courtBooked ? "Booked" : "Not Booked"}
                </Typography>
                <Typography variant="body1" paragraph>
                  {match.description}
                </Typography>

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Players:
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {getSpotInfoForMatch(match).map((spot, index) => (
                    <Grid xs={6} sm={3} key={index}>
                      {spot.status === "match owner" ||
                      spot.status === "occupied" ? (
                        <Paper
                          elevation={2}
                          sx={{
                            p: 2,
                            height: "100px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor:
                              spot.status === "match owner"
                                ? "primary.light"
                                : "success.light",
                          }}
                        >
                          <Avatar
                            sx={{
                              mb: 1,
                              bgcolor:
                                spot.status === "match owner"
                                  ? "primary.main"
                                  : "success.main",
                            }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Typography variant="body2" align="center">
                            {spot.status === "match owner"
                              ? "You"
                              : spot.username === username
                              ? "You"
                              : `User ${spot.username}`}
                          </Typography>
                        </Paper>
                      ) : (
                        <Tooltip
                          title={
                            index === 0
                              ? "This spot is always reserved for the creator"
                              : spot.status === "reserved"
                              ? "Click to unreserve this spot"
                              : "Click to reserve this spot"
                          }
                        >
                          <Paper
                            elevation={2}
                            sx={{
                              p: 2,
                              height: "100px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor:
                                spot.status === "reserved"
                                  ? "warning.light"
                                  : "grey.100",
                              cursor: index === 0 ? "default" : "pointer",
                              "&:hover":
                                index === 0
                                  ? {}
                                  : {
                                      bgcolor:
                                        spot.status === "reserved"
                                          ? "warning.main"
                                          : "grey.300",
                                    },
                            }}
                            onClick={() => {
                              if (index > 0) {
                                toggleReserveSpot(
                                  match.id,
                                  spot.spotIndex,
                                  spot.status === "reserved"
                                );
                              }
                            }}
                          >
                            <Avatar
                              sx={{
                                mb: 1,
                                bgcolor:
                                  spot.status === "reserved"
                                    ? "warning.main"
                                    : "grey.400",
                              }}
                            >
                              {spot.status === "reserved" ? (
                                <LockIcon />
                              ) : (
                                <AddIcon />
                              )}
                            </Avatar>
                            <Typography variant="body2" align="center">
                              {spot.status === "reserved"
                                ? "Reserved"
                                : "Available"}
                            </Typography>
                          </Paper>
                        </Tooltip>
                      )}
                    </Grid>
                  ))}
                </Grid>

                {match.joinRequests.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ mt: 2 }}>
                      Join Requests:
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
                    >
                      {match.joinRequests.map((requester) => (
                        <Button
                          key={requester}
                          variant="outlined"
                          color="primary"
                          size="small"
                          startIcon={<PersonIcon />}
                          onClick={() => handleConfirmJoin(match.id, requester)}
                        >
                          Confirm {requester}
                        </Button>
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>

              <Dialog
                open={deleteConfirmId === match.id}
                onClose={() => setDeleteConfirmId(null)}
              >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                  <Typography>
                    Are you sure you want to delete this padel match? This
                    action cannot be undone.
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => setDeleteConfirmId(null)}
                    color="primary"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDeleteMatch(match.id)}
                    color="error"
                    variant="contained"
                  >
                    Delete
                  </Button>
                </DialogActions>
              </Dialog>
            </Card>
          ))
        )}
      </Box>

      {/* All Matches */}
      <Typography variant="h5" gutterBottom>
        All Matches
      </Typography>
      <Box>
        {allMatches.length === 0 ? (
          <Alert severity="info">No matches available.</Alert>
        ) : (
          allMatches.map((match) => (
            <Card key={match.id} sx={{ mb: 3 }} elevation={3}>
              <CardContent sx={{ pb: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {match.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Posted by User {match.username} on{" "}
                  {new Date(match.createdAt).toLocaleDateString()} | Match
                  scheduled: {new Date(match.matchDateTime).toLocaleString()} |
                  Level: {match.level.toFixed(1)} | Court:{" "}
                  {match.courtBooked ? "Booked" : "Not Booked"}
                </Typography>
                <Typography variant="body1" paragraph>
                  {match.description}
                </Typography>

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Players:
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {getSpotInfoForMatch(match).map((spot, index) => (
                    <Grid xs={6} sm={3} key={index}>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 2,
                          height: "100px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor:
                            spot.status === "match owner"
                              ? "primary.light"
                              : spot.status === "occupied"
                              ? "success.light"
                              : spot.status === "reserved"
                              ? "warning.light"
                              : "grey.100",
                        }}
                      >
                        {(spot.status === "match owner" ||
                          spot.status === "occupied") && (
                          <>
                            <Avatar
                              sx={{
                                mb: 1,
                                bgcolor:
                                  spot.status === "match owner"
                                    ? "primary.main"
                                    : "success.main",
                              }}
                            >
                              <PersonIcon />
                            </Avatar>
                            <Typography variant="body2" align="center">
                              {spot.status === "match owner"
                                ? "You"
                                : spot.username === username
                                ? "You"
                                : `User ${spot.username}`}
                            </Typography>
                          </>
                        )}
                        {spot.status === "reserved" && (
                          <>
                            <Avatar sx={{ mb: 1, bgcolor: "warning.main" }}>
                              <LockIcon />
                            </Avatar>
                            <Typography variant="body2" align="center">
                              Reserved
                            </Typography>
                          </>
                        )}
                        {spot.status === "available" && (
                          <>
                            <Avatar sx={{ mb: 1, bgcolor: "grey.400" }}>
                              <AddIcon />
                            </Avatar>
                            <Typography variant="body2" align="center">
                              Available
                            </Typography>
                          </>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>

              {match.username !== username && (
                <CardActions>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleJoinMatch(match.id)}
                    disabled={
                      match.participants.includes(username || "") ||
                      match.joinRequests.includes(username || "") ||
                      match.participants.length + match.reservedSpots.length >=
                        match.totalSpots
                    }
                  >
                    {match.participants.includes(username || "")
                      ? "Joined"
                      : match.joinRequests.includes(username || "")
                      ? "Request Sent"
                      : "Join Match"}
                  </Button>
                </CardActions>
              )}
            </Card>
          ))
        )}
      </Box>
    </Container>
  );
};

export default CommunityPage;
