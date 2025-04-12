import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
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
import communityApi from "../../services/communityService";
import { PadelMatch } from "../../types/PadelMatch";
import SpotInfo from "../../types/SpotInfo";
import { Helmet } from "react-helmet-async";
import Animation from "../../components/misc/Animation.tsx"
import HomeBar from "../../components/misc/HomeBar.tsx";
import DatePicker, {registerLocale} from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {da} from "date-fns/locale";
import { setHours, setMinutes } from "date-fns";
registerLocale("da", da);

const CommunityPage: React.FC = () => {
  const { username } = useUser();
  const [matches, setMatches] = useState<PadelMatch[]>([]);
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<number>(1.0);
  const [matchDateTime, setMatchDateTime] = useState<Date | null>(null);
  const [courtBooked, setCourtBooked] = useState<"Ja" | "Nej">("Ja");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const getNextHalfHour = () => {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);

    const minutes = now.getMinutes();

    if (minutes < 30) {
      now.setMinutes(30);
    } else {
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
    }

    return now;
  };


  const [selectedDate, setSelectedDate] = useState(getNextHalfHour);
  const [selectedReserved, setSelectedReserved] = useState<number>(0);

  const filterPassedTime = (time: any) => {
    const hour = time.getHours();
    const minutes = time.getMinutes();
    const totalMinutes = hour * 60 + minutes;

    // Tillad kun tider mellem 05:30 (330) og 23:00 (1380)
    return totalMinutes >= 329 && totalMinutes <= 1380;
  };

  const handleHiddenTimes = (time: Date) => {
    const hour = time.getHours();
    const minutes = time.getMinutes();
    const totalMinutes = hour * 60 + minutes;

    return totalMinutes >= 330 && totalMinutes <= 1380 ? "" : "hidden";
  };

  useEffect(() => {
    fetchMatches().then();
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
      fetchMatches().then();
    } catch (err) {
      console.error("Error confirming join:", err);
      alert("Failed to confirm join request");
    }
  };

  const handleDeleteMatch = async (matchId: number) => {
    try {
      await communityApi.deleteMatch(matchId);
      setDeleteConfirmId(null);
      fetchMatches().then();
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
      fetchMatches().then();
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
      <>
        <Helmet>
        <title>Makkerbørs</title>
      </Helmet>

        <Animation>
          <HomeBar />

          <div className="mx-20">

        {/* Form to Create a Match */}
          <div className="w-full bg-white rounded-xl p-4 text-gray-900 mt-10">
            <form className="space-y-4" onSubmit={handleCreateMatch}>

              <h1 className="text-2xl">Opret kamp</h1>

              <div className="grid grid-cols-4 gap-4">

                <div>
                <label htmlFor="center">Vælg center</label>
                <select className="w-full rounded-lg border-gray-900 p-3 text-sm" id="center"
                >
                  <option value="SMASH Padelcenter Horsens">SMASH Padelcenter Horsens</option>
                  <option value="SMASH Padelcenter Stensballe">SMASH Padelcenter Stensballe</option>
                </select>
                </div>

                <div className="flex flex-col">
                <label htmlFor="tidspunkt">Dato og tidspunkt</label>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date!)}
                        showTimeSelect
                        locale="da"
                        timeFormat="HH:mm"
                        timeIntervals={30}
                        showWeekNumbers
                        filterTime={filterPassedTime}
                        minDate={new Date()}
                        minTime={setHours(setMinutes(new Date(), 0), 5)}
                        maxTime={setHours(setMinutes(new Date(), 0), 23)}
                        dateFormat="dd. MMMM yyyy, HH:mm"
                        className="w-full h-12 rounded-lg border-gray-900 text-sm"
                        timeClassName={handleHiddenTimes}
                    />
                  </div>

                <div>
                <label htmlFor="reserverede">Reserverede pladser</label>
                  <div className="flex h-12">
                    <div className="flex items-center w-full border border-gray-900 rounded-lg gap-6 px-1">
                    {[...Array(4)].map((_, index) => (
                        <button
                            onClick={() => setSelectedReserved(index)}
                            className={`p-2 w-full rounded-xl ${selectedReserved === index ? "transition duration-300 bg-cyan-500" : "bg-gray-300"}`}
                            key={index}
                        >
                        {index}
                        </button>
                    ))}
                    </div>
                    </div>
                </div>

                <div>
                  <label htmlFor="reserverede">Bane er booket</label>
                  <div className="flex h-12">
                    <div className="flex items-center justify-between w-full gap-10 border border-gray-900 px-1 rounded-lg">
                      <button
                          onClick={() => setCourtBooked("Ja")}
                          className={`py-1 rounded-xl w-full ${courtBooked === "Ja" ? "transition duration-300 bg-cyan-500" : "bg-gray-300"}`}
                      >
                        Ja
                      </button>
                      <button
                          onClick={() => setCourtBooked("Nej")}
                          className={`py-1 rounded-xl w-full ${courtBooked === "Nej" ? "transition duration-300 bg-cyan-500" : "bg-gray-300"}`}
                      >
                        Nej
                      </button>
                    </div>
                  </div>
                </div>



              </div>
            </form>
          </div>

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
                          (a, b) => new Date(a.matchDateTime).getTime() -
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
        <Box sx={{mb: 4}}>
          {myMatches.length === 0 ? (
              <Alert severity="info">You haven't created any matches yet.</Alert>
          ) : (
              myMatches.map((match) => (
                  <Card
                      key={match.id}
                      sx={{mb: 3, position: "relative"}}
                      elevation={3}
                  >
                    <Box sx={{position: "absolute", top: 10, right: 10}}>
                      <IconButton
                          color="error"
                          onClick={() => setDeleteConfirmId(match.id)}
                          size="small"
                      >
                        <DeleteIcon/>
                      </IconButton>
                    </Box>
                    <CardContent sx={{pb: 1}}>
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

                      <Typography variant="subtitle2" sx={{mb: 1}}>
                        Players:
                      </Typography>
                      <Grid container spacing={2} sx={{mb: 2}}>
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
                                        bgcolor: spot.status === "match owner"
                                            ? "primary.light"
                                            : "success.light",
                                      }}
                                  >
                                    <Avatar
                                        sx={{
                                          mb: 1,
                                          bgcolor: spot.status === "match owner"
                                              ? "primary.main"
                                              : "success.main",
                                        }}
                                    >
                                      <PersonIcon/>
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
                                      title={index === 0
                                          ? "This spot is always reserved for the creator"
                                          : spot.status === "reserved"
                                              ? "Click to unreserve this spot"
                                              : "Click to reserve this spot"}
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
                                          bgcolor: spot.status === "reserved"
                                              ? "warning.light"
                                              : "grey.100",
                                          cursor: index === 0 ? "default" : "pointer",
                                          "&:hover": index === 0
                                              ? {}
                                              : {
                                                bgcolor: spot.status === "reserved"
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
                                            bgcolor: spot.status === "reserved"
                                                ? "warning.main"
                                                : "grey.400",
                                          }}
                                      >
                                        {spot.status === "reserved" ? (
                                            <LockIcon/>
                                        ) : (
                                            <AddIcon/>
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
                            <Typography variant="subtitle2" sx={{mt: 2}}>
                              Join Requests:
                            </Typography>
                            <Box
                                sx={{display: "flex", flexWrap: "wrap", gap: 1, mt: 1}}
                            >
                              {match.joinRequests.map((requester) => (
                                  <Button
                                      key={requester}
                                      variant="outlined"
                                      color="primary"
                                      size="small"
                                      startIcon={<PersonIcon/>}
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
                  <Card key={match.id} sx={{mb: 3}} elevation={3}>
                    <CardContent sx={{pb: 1}}>
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

                      <Typography variant="subtitle2" sx={{mb: 1}}>
                        Players:
                      </Typography>
                      <Grid container spacing={2} sx={{mb: 2}}>
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
                                    bgcolor: spot.status === "match owner"
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
                                            bgcolor: spot.status === "match owner"
                                                ? "primary.main"
                                                : "success.main",
                                          }}
                                      >
                                        <PersonIcon/>
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
                                      <Avatar sx={{mb: 1, bgcolor: "warning.main"}}>
                                        <LockIcon/>
                                      </Avatar>
                                      <Typography variant="body2" align="center">
                                        Reserved
                                      </Typography>
                                    </>
                                )}
                                {spot.status === "available" && (
                                    <>
                                      <Avatar sx={{mb: 1, bgcolor: "grey.400"}}>
                                        <AddIcon/>
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
                              disabled={match.participants.includes(username || "") ||
                                  match.joinRequests.includes(username || "") ||
                                  match.participants.length + match.reservedSpots.length >=
                                  match.totalSpots}
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
          </div>
        </Animation>
        </>
  );
};

export default CommunityPage;
