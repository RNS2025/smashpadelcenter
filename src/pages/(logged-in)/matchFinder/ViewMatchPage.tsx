import { Helmet } from "react-helmet-async";
import Animation from "../../../components/misc/Animation";
import HomeBar from "../../../components/misc/HomeBar";
import {
  BoltIcon,
  MapPinIcon,
  UserCircleIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "../../../context/UserContext";
import { useEffect, useState } from "react";
import { PadelMatch } from "../../../types/PadelMatch";
import communityApi from "../../../services/makkerborsService";
import { Navigate, useParams } from "react-router-dom";
import LoadingSpinner from "../../../components/misc/LoadingSpinner";
import { format } from "date-fns";
import { io } from "socket.io-client";
import { toZonedTime } from "date-fns-tz";
import { da } from "date-fns/locale";
import { User } from "../../../types/user.ts";
import userProfileService from "../../../services/userProfileService.ts";
import PlayerInfoDialog from "../../../components/matchFinder/misc/PlayerInfoDialog.tsx";
import { XIcon } from "lucide-react";
import { MatchInvitedPlayersDialog } from "../../../components/matchFinder/misc/MatchInvitePlayersDialog.tsx";

export const ViewMatchPage = () => {
  const { user } = useUser();
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<PadelMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [participantProfiles, setParticipantProfiles] = useState<User[]>([]);
  const [joinRequestProfiles, setJoinRequestProfiles] = useState<User[]>([]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!match || match.participants.length === 0) return;

      try {
        const profiles = await Promise.all(
          match.participants.map((username) =>
            userProfileService.getOrCreateUserProfile(username)
          )
        );
        setParticipantProfiles(profiles);
      } catch (err) {
        console.error("Fejl ved hentning af deltagerprofiler:", err);
      }
    };

    fetchParticipants().then();
  }, [match]);

  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!match || match.joinRequests.length === 0) return;

      try {
        const profiles = await Promise.all(
          match.joinRequests.map((username) =>
            userProfileService.getOrCreateUserProfile(username)
          )
        );
        setJoinRequestProfiles(profiles);
      } catch (err) {
        console.error(
          "Fejl ved hentning af tilmeldingsanmodningsprofiler:",
          err
        );
      }
    };

    fetchJoinRequests().then();
  }, [match]);

  // Initialize Socket.IO
  useEffect(() => {
    if (!matchId) return;

    // Create socket connection
    const socket = io("https://localhost:3001", {
      path: "/socket.io/",
      rejectUnauthorized: false, // Only use this for development with self-signed certs
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000, // Increase timeout
    });

    // Connection event handlers
    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      setSocketConnected(true);
      socket.emit("joinMatchRoom", matchId);
    });

    socket.on("matchUpdated", (updatedMatch: PadelMatch) => {
      console.log("Received match update:", updatedMatch);
      if (
        updatedMatch &&
        Array.isArray(updatedMatch.participants) &&
        Array.isArray(updatedMatch.joinRequests) &&
        Array.isArray(updatedMatch.reservedSpots)
      ) {
        setMatch(updatedMatch);
      } else {
        console.error("Invalid match update:", updatedMatch);
        setError("Ugyldig kampopdatering modtaget");
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message);
      setSocketConnected(false);
      setError(`Realtidsopdateringer ikke tilgængelige: ${err.message}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Disconnected: ${reason}`);
      setSocketConnected(false);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setSocketConnected(true);
      // Re-join the room after reconnection
      socket.emit("joinMatchRoom", matchId);
    });

    // Clean up
    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("matchUpdated");
        socket.off("connect_error");
        socket.off("reconnect");
        socket.disconnect();
        console.log("Disconnected from Socket.IO server");
      }
    };
  }, [matchId]);

  // Fetch initial match data
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        if (!matchId) {
          setError("Kamp ID mangler");
          setLoading(false);
          return;
        }
        const matchData = await communityApi.getMatchById(matchId);
        console.log("Fetched match data:", matchData);
        if (
          !matchData ||
          !Array.isArray(matchData.participants) ||
          !Array.isArray(matchData.joinRequests)
        ) {
          setError("Fejl ved indlæsning af kampe");
        }
        setMatch(matchData);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching match:", err);
        setError(err.response?.data?.message || "Fejl ved indlæsning af kamp");
        setLoading(false);
      }
    };
    fetchMatch().then();
  }, [matchId]);

  const safeFormatDate = (dateString: string, formatString: string): string => {
    try {
      const utcDate = new Date(dateString);
      const zoned = toZonedTime(utcDate, "UTC");

      return format(zoned, formatString, { locale: da });
    } catch {
      return "Ugyldig dato";
    }
  };

  const handleJoinMatch = async () => {
    if (
      !match ||
      !user?.username ||
      match.participants.includes(user?.username)
    )
      return;
    try {
      const updatedMatch = await communityApi.joinMatch(
        match.id,
        user?.username
      );
      console.log("Updated match after join:", updatedMatch);
      if (!updatedMatch || !Array.isArray(updatedMatch.participants)) {
        setError("Invalid match data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      alert("Tilmelding sendt!");
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error joining match:", error);
      alert(error.response?.data?.message || "Fejl ved tilmelding");
      setError("Fejl ved tilmelding");
    }
  };

  const handleAcceptJoin = async (username: string) => {
    if (!match) return;
    try {
      const updatedMatch = await communityApi.acceptJoinMatch(
        match.id,
        username
      );
      console.log("Updated match after confirm:", updatedMatch);
      if (!updatedMatch || !Array.isArray(updatedMatch.participants)) {
        setError("Invalid match data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      alert("Tilmelding accepteret!");
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved bekræftelse");
      setError("Fejl ved bekræftelse");
    }
  };

  const handleRejectJoin = async (username: string) => {
    if (!match) return;
    try {
      const updatedMatch = await communityApi.rejectJoinMatch(
        match.id,
        username
      );
      console.log("Updated match after confirm:", updatedMatch);
      if (!updatedMatch || !Array.isArray(updatedMatch.participants)) {
        setError("Invalid match data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      alert("Tilmelding afvist!");
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved bekræftelse");
      setError("Fejl ved bekræftelse");
    }
  };

  const handleConfirmJoin = async (username: string) => {
    if (!match) return;
    try {
      const updatedMatch = await communityApi.confirmJoinMatch(
        match.id,
        username
      );
      console.log("Updated match after confirm:", updatedMatch);
      if (!updatedMatch || !Array.isArray(updatedMatch.participants)) {
        setError("Invalid match data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      alert("Tilmelding bekræftet!");
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved bekræftelse");
      setError("Fejl ved bekræftelse");
    }
  };

  const handleDeclineJoin = async (username: string) => {
    if (!match) return;
    try {
      const updatedMatch = await communityApi.declineJoinMatch(
        match.id,
        username
      );
      console.log("Updated match after confirm:", updatedMatch);
      if (!updatedMatch || !Array.isArray(updatedMatch.participants)) {
        setError("Invalid match data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      alert("Tilmelding afvist!");
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved afvisning");
      setError("Fejl ved afvisning");
    }
  };

  const handleRemovePlayerFromMatch = async (username: string) => {
    if (!match) return;
    try {
      const updatedMatch = await communityApi.removePlayer(match.id, username);
      console.log("Updated match after confirm:", updatedMatch);
      if (!updatedMatch || !Array.isArray(updatedMatch.participants)) {
        setError("Invalid match data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      alert("Tilmelding afvist!");
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved afvisning");
      setError("Fejl ved afvisning");
    }
  };

  const handleDeleteMatch = async () => {
    if (!match) return;
    try {
      await communityApi.deleteMatch(match.id);
      alert("Kamp slettet!");
      window.history.back();
    } catch (error: any) {
      console.error("Error deleting match:", error);
      alert(error.response?.data?.message || "Fejl ved sletning af kamp");
      setError("Fejl ved sletning af kamp");
    }
  };

  const handleInvitedPlayers = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 10000);
    } catch (err) {
      console.error("Kunne ikke kopiere link:", err);
    }
  };

  if (!matchId) {
    return <Navigate to="/makkerbørs" replace />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !match) {
    return (
      <>
        <Helmet>
          <title>Kampdetaljer</title>
        </Helmet>
        <Animation>
          <HomeBar />
          <div className="mx-4 my-10">{error || "Kamp ikke fundet"}</div>
        </Animation>
      </>
    );
  }

  const totalLength =
    safeFormatDate(match.matchDateTime, "EEEE | dd. MMMM | HH:mm").length +
    safeFormatDate(match.endTime, "HH:mm").length;
  const isMatchFull = match.participants.length === 4;

  return (
    <>
      <Helmet>
        <title>Kampdetaljer</title>
      </Helmet>

      <div
        onClick={() => setInfoDialogVisible(false)}
        className={`min-h-screen fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center ${
          !infoDialogVisible ? "hidden" : ""
        }`}
      >
        <PlayerInfoDialog user={selectedUser!} />
      </div>

      <div
        className={`min-h-screen fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center ${
          !inviteDialogVisible ? "hidden" : ""
        }`}
      >
        <MatchInvitedPlayersDialog
          user={user!}
          match={match}
          onInvite={async () => {
            setInviteDialogVisible(false);
            await communityApi.getMatchById(matchId);
          }}
          onClose={() => {
            setInviteDialogVisible(false);
          }}
        />
      </div>

      <HomeBar />
      <Animation>
        <div className="mx-4 my-10 space-y-4 text-sm">
          <h1
            className={`justify-self-center font-semibold ${
              totalLength > 31
                ? "text-lg"
                : totalLength > 37
                ? "text-md"
                : "text-xl"
            }`}
          >
            {safeFormatDate(
              match.matchDateTime,
              "EEEE | dd. MMMM | HH:mm"
            ).toUpperCase()}{" "}
            - {safeFormatDate(match.endTime, "HH:mm")}
          </h1>

          <h1 className="text-center text-gray-500 italic text-sm">
            Tryk på et spillernavn for at se mere information
          </h1>

          {!socketConnected && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 mb-4">
              Realtidsopdateringer er ikke tilgængelige. Opdater siden for at se
              de seneste ændringer.
            </div>
          )}

          {/* Participants */}
          {participantProfiles.map((profile) => (
            <>
              <div className="flex items-center gap-2">
                <div
                  key={profile.username}
                  className="border rounded flex items-center px-1 w-full py-3"
                >
                  <div
                    onClick={() => {
                      setSelectedUser(profile);
                      setInfoDialogVisible(true);
                    }}
                    className="flex items-center gap-2 w-full pr-1 truncate"
                  >
                    <UserCircleIcon className="h-14" />
                    <div className="flex flex-col gap-2">
                      <h1>{profile.fullName}</h1>
                      <h1 className="text-gray-500 italic">
                        {profile.username}
                      </h1>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-cyan-500 text-white rounded-full flex items-center justify-center w-12 h-12">
                      {profile.skillLevel.toFixed(1)}
                    </div>

                    <div>
                      {match.username === profile.username ? (
                        <StarIcon className="size-6 text-yellow-500" />
                      ) : (
                        <XIcon
                          onClick={() =>
                            handleRemovePlayerFromMatch(profile.username)
                          }
                          className="size-6 text-red-500"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ))}

          {match.reservedSpots.length > 0 &&
            match.reservedSpots.map((reserved) => (
              <div
                key={reserved.name}
                className="border rounded flex items-center px-1"
              >
                <UserCircleIcon className="h-20" />
                <div className="w-full pr-1 truncate">
                  <h1>{reserved.name}</h1>
                </div>
                <div className="bg-cyan-500 text-white rounded-full flex items-center justify-center w-20 h-12">
                  {reserved.level}
                </div>
              </div>
            ))}

          {/* Empty spots */}
          {[
            ...Array(
              match.totalSpots -
                (match.participants.length + (match.reservedSpots.length || 0))
            ),
          ].map((_, index) => (
            <div
              key={`empty-${index}`}
              className="border border-gray-500 rounded flex items-center px-1"
            >
              <UserCircleIcon className="h-20 text-gray-500" />
              <div className="w-full pr-1 truncate">
                <h1 className="text-xl text-gray-500">Ledig plads</h1>
              </div>
              <div className="bg-gray-500 text-white rounded-full flex items-center justify-center w-16 h-12">
                ?
              </div>
            </div>
          ))}

          {/* Join requests (visible to creator) */}
          {match.username === user?.username &&
            Array.isArray(match.joinRequests) &&
            match.joinRequests.length > 0 && (
              <>
                <h2 className="font-semibold">Tilmeldingsanmodninger</h2>
                {joinRequestProfiles.map((requester, index) => (
                  <div
                    onClick={() => {
                      setSelectedUser(requester);
                      setInfoDialogVisible(true);
                    }}
                    key={index}
                    className="border rounded flex flex-col p-2 gap-2" // FLEX COL + GAP
                  >
                    <div className="flex items-center">
                      <UserCircleIcon className="h-20" />
                      <div className="flex flex-col w-full pr-1 truncate">
                        <h1>{requester.username}</h1>
                        <h1 className="text-gray-500">Afventer bekræftelse</h1>
                      </div>
                      <div className="bg-yellow-600 text-white rounded-full flex items-center justify-center w-20 h-12">
                        {requester.skillLevel.toFixed(1)}
                      </div>
                    </div>

                    <div className="flex justify-center gap-4">
                      <XIcon
                        onClick={() => handleDeclineJoin(requester.username)}
                        className="size-8 text-red-500"
                      />
                      <CheckIcon
                        onClick={() => handleConfirmJoin(requester.username)}
                        className="size-8 text-green-500"
                      />
                    </div>
                  </div>
                ))}
              </>
            )}

          {user &&
            match.invitedPlayers &&
            match.invitedPlayers.includes(user.username) && (
              <div className="flex justify-between items-center border border-yellow-500 p-4 rounded-lg animate-pulse">
                <h1>{match.username} har inviteret dig!</h1>
                <div className="flex gap-2">
                  <XIcon
                    className="size-8 text-red-500"
                    onClick={() => handleRejectJoin(user.username)}
                  />
                  <CheckIcon
                    className="size-8 text-green-500"
                    onClick={() => handleAcceptJoin(user.username)}
                  />
                </div>
              </div>
            )}

          {/* Match details */}

          <div className="grid grid-cols-2 text-center text-black gap-3">
            <div className="bg-white rounded flex justify-center items-center gap-1 py-4">
              <BoltIcon className="h-6 text-yellow-500" />
              <h1 className="h-5">{match.level}</h1>
            </div>

            <div className="bg-white rounded flex justify-center items-center gap-1 py-4">
              <MapPinIcon className="h-6 text-red-500" />
              <h1 className="h-5">{match.location.split(" ")[2]}</h1>
            </div>

            {match.courtBooked ? (
              <div className="bg-white rounded flex justify-center items-center gap-1 py-4">
                <CheckCircleIcon className="h-6 rounded-lg text-green-500" />
                <h1 className="h-5">Bane er booket</h1>
              </div>
            ) : (
              <div className="bg-white rounded flex justify-center items-center gap-1 py-4">
                <XCircleIcon className="h-6 rounded-lg text-red-500" />
                <h1 className="h-5">Bane ikke booket</h1>
              </div>
            )}

            <div className="bg-white rounded flex justify-center items-center gap-1 py-4">
              <UserGroupIcon className="h-6 rounded-lg text-white bg-gradient-to-b from-sky-400 to-pink-400" />
              <h1 className="h-5">{match.matchType}</h1>
            </div>
          </div>

          <div className="bg-white rounded w-full text-black p-4 flex flex-col gap-2">
            <h1 className="font-semibold">Bemærkninger</h1>
            <p>{match.description || "Ingen bemærkninger."}</p>
          </div>

          {/* Action buttons */}

          {user?.username &&
            match.username !== user?.username &&
            !match.participants.includes(user?.username) &&
            !isMatchFull && (
              <button
                onClick={handleJoinMatch}
                className={`bg-cyan-500 hover:bg-cyan-600 transition duration-300 rounded-lg py-2 px-4 text-white ${
                  match.joinRequests.includes(user?.username)
                    ? "bg-gray-700 animate-pulse"
                    : ""
                }`}
                disabled={match.joinRequests.includes(user?.username)}
              >
                {match.joinRequests.includes(user?.username)
                  ? "Anmodning sendt"
                  : "Tilmeld dig"}
              </button>
            )}

          {match.username === user?.username && (
            <>
              <div className="flex flex-col w-full gap-4 text-lg">
                <button
                  onClick={() => setInviteDialogVisible(true)}
                  className="bg-green-500 hover:bg-green-600 transition duration-300 rounded-lg py-2 px-4 text-white"
                >
                  Inviter spillere
                </button>

                <div
                  onClick={handleInvitedPlayers}
                  className="flex justify-center hidden bg-green-500 hover:bg-green-600 transition duration-300 rounded-lg py-2 px-4 text-white"
                >
                  {!copied ? (
                    <>
                      <DocumentDuplicateIcon className="h-5" />
                      <h1>Kopier kamplink</h1>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5" />
                      <h1>Link kopieret!</h1>
                    </>
                  )}
                </div>

                <button
                  onClick={handleDeleteMatch}
                  className="bg-red-500 hover:bg-red-600 transition duration-300 rounded-lg py-2 px-4 text-white"
                >
                  Slet kamp
                </button>
              </div>
            </>
          )}
        </div>
      </Animation>
    </>
  );
};

export default ViewMatchPage;
