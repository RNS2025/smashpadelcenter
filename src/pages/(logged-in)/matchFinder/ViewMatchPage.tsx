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
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "../../../context/UserContext";
import {useEffect, useState, useMemo, useCallback} from "react";
import { PadelMatch } from "../../../types/PadelMatch";
import communityApi from "../../../services/makkerborsService";
import { Navigate, useParams } from "react-router-dom";
import LoadingSpinner from "../../../components/misc/LoadingSpinner";
import { User } from "../../../types/user.ts";
import userProfileService from "../../../services/userProfileService.ts";
import PlayerInfoDialog from "../../../components/matchFinder/misc/PlayerInfoDialog.tsx";
import { MatchInvitedPlayersDialog } from "../../../components/matchFinder/misc/MatchInvitePlayersDialog.tsx";
import { safeFormatDate } from "../../../utils/dateUtils.ts";
import usePolling from "../../../hooks/usePolling.ts";
import {createICSFile, downloadICSFile} from "../../../utils/ICSFile.ts";

export const ViewMatchPage = () => {
  const { user } = useUser();
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<PadelMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantProfiles, setParticipantProfiles] = useState<User[]>([]);
  const [joinRequestProfiles, setJoinRequestProfiles] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const profileCache = useMemo(() => new Map<string, User>(), []);

  // Retry helper function
  const retry = async <T,>(
    fn: () => Promise<T>,
    retries: number,
    delay: number
  ): Promise<T | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          console.warn(`Retry ${i + 1}/${retries} failed:`, err);
        }
      }
    }
    return null;
  };

  const handleConfirmJoin = useCallback(async (username: string) => {
    if (!match) return;
    try {
      console.log("Confirming join:", { matchId: match.id, username });
      const updatedMatch = await communityApi.confirmJoinMatch(
          match.id,
          username
      );
      console.log("Updated match after confirm:", updatedMatch);
      if (!updatedMatch || !Array.isArray(updatedMatch.participants)) {
        setError("Invalid match data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error confirming join:", error.response?.data);
      alert(error.response?.data?.message || "Fejl ved bekræftelse");
      setError("Fejl ved bekræftelse");
    }
  },[match]);

  const handleDeclineJoin = useCallback(async (username: string) => {
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
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved afvisning");
      setError("Fejl ved afvisning");
    }
  },[match]);

  const handleRemovePlayerFromMatch = useCallback(async (username: string) => {
    if (!match) return;
    try {
      const updatedMatch = await communityApi.removePlayer(match.id, username);
      console.log("Updated match after confirm:", updatedMatch);
      if (!updatedMatch || !Array.isArray(updatedMatch.participants)) {
        setError("Invalid match data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved afvisning");
      setError("Fejl ved afvisning");
    }
  },[match]);

  // Memoized lists
  const participantList = useMemo(() => {
    if (!match) return [];
    return participantProfiles.map((profile) => (
      <div key={profile.username} className="flex items-center gap-2">
        <div className="border rounded flex items-center px-1 w-full py-3">
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
              <h1>{profile.username}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500 text-white rounded-full flex items-center justify-center w-12 h-12">
              {profile.skillLevel?.toFixed(1) || "?"}
            </div>
            <div>
              {match.username === profile.username ? (
                <StarIcon className="size-6 text-yellow-500" />
              ) : (
                <XMarkIcon
                  onClick={() => handleRemovePlayerFromMatch(profile.username)}
                  className={`size-6 text-red-500 ${
                    match.username !== user?.username ? "hidden" : ""
                  }`}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    ));
  }, [match, participantProfiles, user?.username, handleRemovePlayerFromMatch]);

  const reservedSpotsList = useMemo(() => {
    if (!match) return [];
    return match.reservedSpots.map((reserved) => (
      <div
        key={reserved.name}
        className="border rounded flex items-center px-1 w-full py-3"
      >
        <div className="flex items-center gap-2 w-full pr-1 truncate">
          <UserCircleIcon className="h-14" />
          <div className="flex flex-col gap-2">
            <h1>{reserved.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-cyan-500 text-white rounded-full flex items-center justify-center w-12 h-12">
            {reserved.level}
          </div>
          <StarIcon className="size-6 text-gray-500" />
        </div>
      </div>
    ));
  }, [match]);

  const emptySpotsList = useMemo(() => {
    if (!match) return [];
    return [
      ...Array(
        match.totalSpots -
          (match.participants.length + (match.reservedSpots.length || 0))
      ),
    ].map((_, index) => (
      <div
        key={`empty-${index}`}
        className="border border-gray-500 rounded flex items-center px-1"
      >
        <UserCircleIcon className="size-20 text-gray-500" />
        <div className="w-full pr-1 truncate">
          <h1 className="text-xl text-gray-500">Ledig plads</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gray-500 text-white rounded-full flex items-center justify-center size-12">
            ?
          </div>
          <div></div>
        </div>
      </div>
    ));
  }, [match]);

  const joinRequestsList = useMemo(() => {
    if (!match) return [];
    return joinRequestProfiles.map((requester, index) => (
      <div key={index} className="border rounded flex flex-col p-2 gap-2">
        <div
          onClick={() => {
            setSelectedUser(requester);
            setInfoDialogVisible(true);
          }}
          className="flex items-center"
        >
          <UserCircleIcon className="h-20" />
          <div className="flex flex-col w-full pr-1 truncate">
            <h1>{requester.username}</h1>
            <h1 className="text-gray-500">Afventer bekræftelse</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-yellow-600 text-white rounded-full flex items-center justify-center w-12 h-12">
              {requester.skillLevel?.toFixed(1) || "?"}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <XMarkIcon
            onClick={() => handleDeclineJoin(requester.username)}
            className="size-8 text-red-500"
          />
          <CheckIcon
            onClick={() => handleConfirmJoin(requester.username)}
            className="size-8 text-green-500"
          />
        </div>
      </div>
    ));
  }, [handleConfirmJoin, handleDeclineJoin, joinRequestProfiles, match]);
  

  // Polling for match data
  const fetchMatch = useCallback(async () => {
    if (!matchId) {
      throw new Error("Kamp ID mangler");
    }
    const matchData = await communityApi.getMatchById(matchId);
    if (
      !matchData ||
      !Array.isArray(matchData.participants) ||
      !Array.isArray(matchData.joinRequests)
    ) {
      throw new Error("Fejl ved indlæsning af kampe");
    }
    return matchData;
  }, [matchId]);

  // Initial fetch
  useEffect(() => {
    const initialFetch = async () => {
      try {
        const matchData = await fetchMatch();
        setMatch(matchData);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Kunne ikke indlæse kamp");
        setLoading(false);
      }
    };
    initialFetch().then();
  }, [fetchMatch, matchId]);

  // Compare match data to avoid unnecessary updates
  const shouldUpdateMatch = (
    newMatch: PadelMatch,
    prevMatch: PadelMatch | null
  ) => {
    if (!prevMatch) return true;
    return (
      newMatch.id !== prevMatch.id ||
      JSON.stringify(newMatch.participants) !==
        JSON.stringify(prevMatch.participants) ||
      JSON.stringify(newMatch.joinRequests) !==
        JSON.stringify(prevMatch.joinRequests) ||
      JSON.stringify(newMatch.invitedPlayers) !==
        JSON.stringify(prevMatch.invitedPlayers) ||
      newMatch.matchDateTime !== prevMatch.matchDateTime ||
      newMatch.endTime !== prevMatch.endTime ||
      newMatch.location !== prevMatch.location ||
      newMatch.level !== prevMatch.level ||
      newMatch.matchType !== prevMatch.matchType ||
      newMatch.description !== prevMatch.description ||
      newMatch.courtBooked !== prevMatch.courtBooked ||
      JSON.stringify(newMatch.reservedSpots) !==
        JSON.stringify(prevMatch.reservedSpots)
    );
  };

  usePolling(
    fetchMatch,
    (matchData) => {
      console.log("Updating match:", matchData);
      setMatch(matchData);
    },
    {
      interval: 10000,
      enabled: !!matchId,
      shouldUpdate: shouldUpdateMatch,
    }
  );

  // Fetch participant profiles
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!match || match.participants.length === 0) {
        setParticipantProfiles([]);
        return;
      }

      setProfilesLoading(true);
      try {
        const profiles = await Promise.all(
          match.participants.map(async (username) => {
            if (profileCache.has(username)) {
              return profileCache.get(username)!;
            }
            const profile = await retry(
              () => userProfileService.getOrCreateUserProfile(username),
              3,
              1000
            );
            if (profile) {
              profileCache.set(username, profile);
              return profile;
            }
            console.warn(
              `Failed to fetch profile for ${username} after retries`
            );
            return {
              username,
              fullName: "Unknown",
              skillLevel: 0,
            } as User;
          })
        );
        setParticipantProfiles(profiles);
      } catch (err) {
        console.error("Fejl ved hentning af deltagerprofiler:", err);
        setError("Fejl ved hentning af spillerprofiler");
      } finally {
        setProfilesLoading(false);
      }
    };

    fetchParticipants();
  }, [match, match?.participants, profileCache]);

  // Fetch join request profiles
  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!match || match.joinRequests.length === 0) {
        setJoinRequestProfiles([]);
        return;
      }

      setProfilesLoading(true);
      try {
        const profiles = await Promise.all(
          match.joinRequests.map(async (username) => {
            if (profileCache.has(username)) {
              return profileCache.get(username)!;
            }
            const profile = await retry(
              () => userProfileService.getOrCreateUserProfile(username),
              3,
              1000
            );
            if (profile) {
              profileCache.set(username, profile);
              return profile;
            }
            console.warn(
              `Failed to fetch profile for ${username} after retries`
            );
            return {
              username,
              fullName: "Unknown",
              skillLevel: 0,
            } as User;
          })
        );
        setJoinRequestProfiles(profiles);
      } catch (err) {
        console.error(
          "Fejl ved hentning af tilmeldingsanmodningsprofiler:",
          err
        );
        setError("Fejl ved hentning af anmodningsprofiler");
      } finally {
        setProfilesLoading(false);
      }
    };

    fetchJoinRequests();
  }, [match, match?.joinRequests, profileCache]);

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
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved bekræftelse");
      setError("Fejl ved bekræftelse");
    }
  };

  const handleCancelJoinRequest = async (username: string) => {
    if (!match) return;
    try {
      const updatedMatch = await communityApi.playerCancelJoinMatch(
        match.id,
        username
      );
      if (!updatedMatch || !Array.isArray(updatedMatch.participants)) {
        setError("Invalid match data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      setMatch(updatedMatch);
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved annullering");
      setError("Fejl ved annullering");
    }
  };


  const handleDeleteMatch = async () => {
    if (!match) return;
    try {
      const userConfirm = confirm("Er du sikker på at du vil slette kampen?");
      if (userConfirm) {
        await communityApi.deleteMatch(match.id);
        window.history.back();
      }
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
      setError("Kunne ikke kopiere link");
    }
  };

  if (!matchId) {
    return <Navigate to="/makkerbørs" replace />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !match) {
    return (
      <>
        <Helmet>
          <title>Kampdetaljer</title>
        </Helmet>
        <Animation>
          <HomeBar />
          <div className="mx-4 my-10">{error}</div>
        </Animation>
      </>
    );
  }

  const totalLength =
    safeFormatDate(match!.matchDateTime, "EEEE | dd. MMMM | HH:mm").length +
    safeFormatDate(match!.endTime, "HH:mm").length;
  const isMatchFull = match!.participants.length === 4;

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
          match={match!}
          onInvite={async () => {
            setInviteDialogVisible(false);
            const updatedMatch = await communityApi.getMatchById(matchId!);
            setMatch(updatedMatch);
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
            className={`text-center font-semibold ${
              totalLength > 31
                ? "text-lg"
                : totalLength > 37
                ? "text-md"
                : "text-xl"
            }`}
          >
            {safeFormatDate(
              match!.matchDateTime,
              "EEEE | dd. MMMM | HH:mm"
            ).toUpperCase()}{" "}
            - {safeFormatDate(match!.endTime, "HH:mm")}
          </h1>

          <h1 className="text-center text-gray-500 italic text-sm">
            Tryk på et spillernavn for at se mere information
          </h1>

          {/* Participants */}
          {profilesLoading ? (
            <div className="text-center text-gray-500">Indlæser profiler...</div>
          ) : (
            participantList
          )}

          {match!.reservedSpots.length > 0 && reservedSpotsList}

          {/* Empty spots */}
          {emptySpotsList}

          {/* Join requests (visible to creator) */}
          {match!.username === user?.username &&
            Array.isArray(match!.joinRequests) &&
            match!.joinRequests.length > 0 && (
              <>
                <h2 className="font-semibold">Tilmeldingsanmodninger</h2>
                {profilesLoading ? (
                  <div className="text-center text-gray-500">
                    Indlæser profiler...
                  </div>
                ) : (
                  joinRequestsList
                )}
              </>
            )}

          {user &&
            match!.invitedPlayers &&
            match!.invitedPlayers.includes(user.username) && (
              <div className="flex justify-between items-center border border-yellow-500 p-4 rounded-lg">
                <h1>{match!.username} har inviteret dig!</h1>
                <div className="flex gap-2">
                  <XMarkIcon
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
              <h1 className="h-5">{match!.level}</h1>
            </div>

            <div className="bg-white rounded flex justify-center items-center gap-1 py-4">
              <MapPinIcon className="h-6 text-red-500" />
              <h1 className="h-5">{match!.location.split(" ")[2]}</h1>
            </div>

            {match!.courtBooked ? (
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
              <h1 className="h-5">{match!.matchType}</h1>
            </div>
          </div>

          <div className="bg-white rounded w-full text-black p-4 flex flex-col gap-2">
            <h1 className="font-semibold">Bemærkninger</h1>
            <p>{match!.description || "Ingen bemærkninger."}</p>
          </div>

          {/* Action buttons */}
          {user?.username &&
            match!.username !== user.username &&
            !match!.participants.includes(user.username) &&
            !match!.invitedPlayers.includes(user.username) &&
            !isMatchFull &&
            !match!.joinRequests.includes(user.username) && (
              <button
                onClick={handleJoinMatch}
                className="bg-cyan-500 hover:bg-cyan-600 transition duration-300 rounded-lg py-2 px-4 text-white"
              >
                Tilmeld kamp
              </button>
            )}

          {user?.username &&
            match!.username !== user.username &&
            match!.joinRequests.includes(user.username) && (
              <button
                onClick={() => handleCancelJoinRequest(user.username)}
                className="bg-red-500 hover:bg-red-600 transition duration-300 rounded-lg py-2 px-4 text-white"
              >
                Fjern tilmeldingsanmodning
              </button>
            )}

          {match!.username === user?.username && (
            <>
              <div className="flex flex-col w-full gap-4 text-lg">
                <button
                  onClick={() => setInviteDialogVisible(true)}
                  className="bg-green-500 hover:bg-green-600 transition duration-300 rounded-lg py-2 px-4 text-white"
                >
                  Inviter spillere
                </button>

                <button onClick={() => {
                  const ics = createICSFile(
                      "Padelkamp",
                      match!.description,
                      match!.location,
                      new Date(match!.matchDateTime),
                      new Date(match!.endTime)
                  );
                  downloadICSFile(ics, `padelkamp-${match!.id}.ics`);
                }} className="bg-cyan-500 hover:bg-cyan-600 transition duration-300 rounded-lg py-2 px-4 text-white">
                  Tilføj til kalender
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
