import { Helmet } from "react-helmet-async";
import HomeBar from "../../../components/misc/HomeBar";
import Animation from "../../../components/misc/Animation";
import { useUser } from "../../../context/UserContext.tsx";
import { Navigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { User } from "../../../types/user.ts";
import { PrivateEvent } from "../../../types/PrivateEvent.ts";
import communityApi from "../../../services/makkerborsService.ts";
import LoadingSpinner from "../../../components/misc/LoadingSpinner.tsx";
import PlayerInfoDialog from "../../../components/matchFinder/misc/PlayerInfoDialog.tsx";
import { safeFormatDate } from "../../../utils/dateUtils.ts";
import {
  BoltIcon,
  CheckCircleIcon,
  CheckIcon, CurrencyDollarIcon,
  DocumentDuplicateIcon,
  MapPinIcon, StarIcon,
  UserCircleIcon,
  UserGroupIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import mockEvents from "../../../utils/mock/mockEvents.ts";
import userProfileService from "../../../services/userProfileService.ts";
import EventInvitedPlayersDialog from "../../../components/private-event/misc/EventInvitePlayersDialog.tsx";
import {XIcon} from "lucide-react";

export const ViewEventPage = () => {
  const { user } = useUser();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<PrivateEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantProfiles, setParticipantProfiles] = useState<User[]>([]);
  const [joinRequestProfiles, setJoinRequestProfiles] = useState<User[]>([]);
  const [eventHost, setEventHost] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);

  const [copied, setCopied] = useState(false);

  const useMockData = false;

  useEffect(() => {
    if (!eventId || !user?.username) return;

    const fetchEvent = async () => {
      if (useMockData) {
        const foundEvent = mockEvents.find((e) => e.id === eventId);
        if (foundEvent) {
          setEvent(foundEvent);
        } else {
          setError("Event ikke fundet");
        }
        setLoading(false);
        return;
      }

      try {
        const fetched = await communityApi.getEventById(eventId);
        console.log(fetched);
        setEvent(fetched);
      } catch (err) {
        console.error("Fejl ved hentning af event:", err);
        setError("Kunne ikke hente event");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent().then();
  }, [eventId, useMockData, user?.username]);

  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!event || event.joinRequests.length === 0) return;

      try {
        const profiles = await Promise.all(
            event.joinRequests.map((username) =>
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
  }, [event]);

  useEffect(() => {
    const fetchParticipantProfiles = async () => {
      if (!event || event.participants.length === 0) return;

      try {
        const profiles = await Promise.all(
          event.participants.map((username) =>
            userProfileService.getOrCreateUserProfile(username)
          )
        );
        setParticipantProfiles(profiles);
      } catch (err) {
        console.error("Fejl ved hentning af deltagerprofiler:", err);
      }
    };

    fetchParticipantProfiles().then();
  }, [event]);

  useEffect(() => {
    const fetchEventHost = async () => {
      if (!event || !event.username) return;

      try {
        const hostProfile = await userProfileService.getOrCreateUserProfile(
          event.username
        );
        setEventHost(hostProfile);
      } catch (err) {
        console.error("Fejl ved hentning af værtprofil:", err);
      }
    };

    fetchEventHost().then();
  }, [event]);

  const handleJoinEvent = async () => {
    if (
      !event ||
      !user?.username ||
      event.participants.includes(user?.username)
    )
      return;
    try {
      const updatedEvent = await communityApi.joinEvent(
        event.id,
        user?.username
      );
      console.log("Updated event after join:", updatedEvent);
      if (!updatedEvent || !Array.isArray(updatedEvent.participants)) {
        setError("Invalid event data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      setEvent(updatedEvent);
    } catch (error: any) {
      console.error("Error joining event:", error);
      alert(error.response?.data?.message || "Fejl ved tilmelding");
      setError("Fejl ved tilmelding");
    }
  };

  const handleConfirmJoin = async (participant: string) => {
    if (!event) return;
    try {
      const updatedEvent = await communityApi.confirmJoinEvent(
        event.id,
        participant
      );
      console.log("Updated event after confirm:", updatedEvent);
      if (!updatedEvent || !Array.isArray(updatedEvent.participants)) {
        setError("Invalid event data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      setEvent(updatedEvent);
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved bekræftelse");
      setError("Fejl ved bekræftelse");
    }
  };

  const handleDeclineJoin = async (username: string) => {
    if (!event) return;
    try {
      const userConfirmed = confirm("Er du sikker på at du vil afvise tilmeldingen?");
      if (userConfirmed) {
      const updatedEvent = await communityApi.confirmDeclinePrivateEvent(event.id, username);
      console.log("Updated event after confirm:", updatedEvent);
      if (!updatedEvent || !Array.isArray(updatedEvent.participants)) {
        setError("Invalid match data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      setEvent(updatedEvent);
      }
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved afvisning");
      setError("Fejl ved afvisning");
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    try {
      const userConfirmed = confirm("Er du sikker på at du vil slette arrangementet?");
      if (userConfirmed) {
      await communityApi.deleteEvent(event.id);
      window.history.back();
      }
    } catch (error: any) {
      console.error("Error deleting event:", error);
      alert(
        error.response?.data?.message || "Fejl ved sletning af arrangement"
      );
      setError("Fejl ved sletning af arrangement");
    }
  };

  const handleRejectJoin = async (username: string) => {
    if (!event) return;
    try {
      const updatedEvent = await communityApi.confirmDeclinePrivateEvent(
        event.id,
        username
      );
      console.log("Updated event after reject:", updatedEvent);
      if (!updatedEvent || !Array.isArray(updatedEvent.participants)) {
        setError("Invalid event data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      setEvent(updatedEvent);
    } catch (error: any) {
      console.error("Error rejecting join:", error);
      alert(error.response?.data?.message || "Fejl ved afvisning");
      setError("Fejl ved afvisning");
    }
  };

  const handleAcceptJoin = async (username: string) => {
    if (!event) return;
    try {
      const updatedEvent = await communityApi.confirmAcceptPrivateEvent(
        event.id,
        username
      );
      console.log("Updated event after accept:", updatedEvent);
      if (!updatedEvent || !Array.isArray(updatedEvent.participants)) {
        setError("Invalid event data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      setEvent(updatedEvent);
    } catch (error: any) {
      console.error("Error accepting join:", error);
      alert(error.response?.data?.message || "Fejl ved accept");
      setError("Fejl ved accept");
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

  const handleRemovePlayerFromEvent = async (username: string) => {
    if (!event || !user?.username) return;
    try {
      const userConfirmed = confirm("Er du sikker på at du vil fjerne spilleren?");
      if (userConfirmed) {
      const updatedEvent = await communityApi.removePlayerFromEvent(
        event.id,
        username
      );
      console.log("Updated event after removing player:", updatedEvent);
      setEvent(updatedEvent);
      }
    } catch (error: any) {
      console.error("Error removing player from event:", error);
      alert(error.response?.data?.message || "Fejl ved fjernelse");
      setError("Fejl ved fjernelse");
    }
  }

  if (!eventId) {
    return <Navigate to="/privat-arrangementer" replace />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !event) {
    return (
      <>
        <Helmet>
          <title>Detaljer for arrangement</title>
        </Helmet>
        <Animation>
          <HomeBar />
          <div className="mx-4 my-10">{error || "Arrangement ikke fundet"}</div>
        </Animation>
      </>
    );
  }

  const totalLength =
    safeFormatDate(event.eventDateTime, "EEEE | dd. MMMM | HH:mm").length +
    safeFormatDate(event.endTime, "HH:mm").length;
  const isEventFull = event.participants.length === event.totalSpots;

  return (
    <>
      <Helmet>
        <title>Detaljer for arrangement</title>
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
        <EventInvitedPlayersDialog
          event={event}
          onInvite={async () => {
            setInviteDialogVisible(false);
            await communityApi.getEventById(eventId);
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
              event.eventDateTime,
              "EEEE | dd. MMMM | HH:mm"
            ).toUpperCase()}{" "}
            - {safeFormatDate(event.endTime, "HH:mm")}
          </h1>

          <h1 className="text-center text-gray-500 italic text-sm">
            Tryk på et spillernavn for at se mere information
          </h1>

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
                        <h1>{profile.username}</h1>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-cyan-500 text-white rounded-full flex items-center justify-center w-12 h-12">
                        {profile.skillLevel.toFixed(1)}
                      </div>

                      <div>
                        {event.username === profile.username ? (
                            <StarIcon className="size-6 text-yellow-500" />
                        ) : (
                            <XIcon
                                onClick={() =>
                                    handleRemovePlayerFromEvent(profile.username)
                                }
                                className={`size-6 text-red-500 ${event.username !== user?.username ? "hidden" : ""}`} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
          ))}

          {/* Empty spots */}
          {event.totalSpots > 8 ? (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(event.totalSpots - event.participants.length)].map(
                    (_, index) => (
                        <div
                            key={`empty-${index}`}
                            className="border border-gray-500 rounded flex items-center px-1 py-2"
                        >
                          <UserCircleIcon className="size-10 text-gray-500" />
                          <div className="w-full pr-1 truncate">
                            <h1 className="text-sm text-gray-500">Ledig plads</h1>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-500 text-white rounded-full flex items-center justify-center size-5">
                              ?
                            </div>
                          </div>
                        </div>
                    )
                )}
              </div>
          ) : (
              <>
                {[...Array(event.totalSpots - event.participants.length)].map(
                    (_, index) => (
                        <div
                            key={`empty-${index}`}
                            className="border border-gray-500 rounded flex items-center px-1 py-2"
                        >
                          <UserCircleIcon className="size-20 text-gray-500" />
                          <div className="w-full pr-1 truncate">
                            <h1 className="text-xl text-gray-500">Ledig plads</h1>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-500 text-white rounded-full flex items-center justify-center size-12">
                              ?
                            </div>
                          </div>
                        </div>
                    )
                )}
              </>
          )}


          {/* Join requests (visible to creator) */}
          {event.username === user?.username &&
              Array.isArray(event.joinRequests) &&
              event.joinRequests.length > 0 && (
                  <>
                    <h2 className="font-semibold">Tilmeldingsanmodninger</h2>
                {joinRequestProfiles.map((requester, index) => (
                    <div
                        key={index}
                        className="border rounded flex flex-col p-2 gap-2"
                    >
                      <div onClick={() => {
                        setSelectedUser(requester);
                        setInfoDialogVisible(true);
                      }} className="flex items-center">
                        <UserCircleIcon className="h-20" />
                        <div className="flex flex-col w-full pr-1 truncate">
                          <h1>{requester.username}</h1>
                          <h1 className="text-gray-500">Afventer bekræftelse</h1>
                        </div>


                        <div className="flex items-center gap-2">
                        <div className="bg-yellow-600 text-white rounded-full flex items-center justify-center w-12 h-12">
                          {requester.skillLevel.toFixed(1)}
                        </div>
                        </div>
                      </div>


                      <div className="flex justify-center gap-4">
                        <XIcon onClick={() => handleDeclineJoin(requester.username)} className="size-8 text-red-500" />
                        <CheckIcon onClick={() => handleConfirmJoin(requester.username)} className="size-8 text-green-500" />
                      </div>
                    </div>
                ))}
                  </>
              )}

          {user &&
            event.invitedPlayers &&
            event.invitedPlayers.includes(user.username) && (
              <div className="flex justify-between items-center border border-yellow-500 p-4 rounded-lg animate-pulse">
                <h1>{event.username} har inviteret dig!</h1>
                <div className="flex gap-2">
                  <XCircleIcon
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

          <div className="grid grid-cols-2 text-center text-black gap-3">
            <div
              className={`bg-white rounded flex justify-center items-center gap-1 py-4 ${
                !event.level ? "hidden" : ""
              }`}
            >
              <BoltIcon className="h-6 text-yellow-500" />
              <h1 className="h-5">{event.level}</h1>
            </div>

            <div className="bg-white rounded flex justify-center items-center gap-1 py-4">
              <MapPinIcon className="h-6 text-red-500" />
              <h1 className="h-5">{event.location.split(" ")[2]}</h1>
            </div>

            {event.courtBooked ? (
              <div className="bg-white rounded flex justify-center items-center gap-1 py-4">
                <CheckCircleIcon className="h-6 rounded-lg text-green-500" />
                <h1 className="h-5">
                  {event.participants.length > 4 ? "Baner" : "Bane"} er booket
                </h1>
              </div>
            ) : (
              <div className="bg-white rounded flex justify-center items-center gap-1 py-4">
                <XCircleIcon className="h-6 rounded-lg text-red-500" />
                <h1 className="h-5">Bane ikke booket</h1>
              </div>
            )}

            <div
              className={`bg-white rounded flex justify-center items-center gap-1 py-4 ${
                !event.eventFormat ? "hidden" : ""
              }`}
            >
              <UserGroupIcon className="h-6 rounded-lg text-white bg-gradient-to-b from-sky-400 to-pink-400" />
              <h1 className="h-5 truncate overflow-hidden whitespace-nowrap max-w-[100px]">
                {event.eventFormat}
              </h1>
            </div>
          </div>

          {event.price && event.price > 0 && (
              <>
                <div
                    onClick={() => {
                      if (eventHost?.phoneNumber) {
                        navigator.clipboard.writeText(eventHost.phoneNumber).then(() => {
                          window.location.href = `mobilepay://`;
                        });
                      }
                    }}
                    className="bg-white rounded flex flex-col justify-center items-center gap-2 py-4"
                >
                  <div className="flex items-center">
                  <CurrencyDollarIcon className="size-10 rounded-lg text-yellow-600 bg-gradient-to-b" />
                  <h1 className="text-black text-lg truncate overflow-hidden whitespace-nowrap">
                    {event.price} kr. {eventHost?.phoneNumber && `til ${eventHost.phoneNumber}`}
                  </h1>
                  </div>
                  <p className={`text-gray-500 italic truncate overflow-hidden whitespace-nowrap ${!eventHost?.phoneNumber ? "hidden" : ""}`}>
                    Klik for at kopiere nummer og gå til MobilePay
                  </p>
                </div>
              </>
          )}


          <div className="bg-white rounded w-full text-black p-4 flex flex-col gap-2">
            <h1 className="font-semibold">Bemærkninger</h1>
            <p>{event.description || "Ingen bemærkninger."}</p>
          </div>

          {/* Action buttons */}
          {event.username !== user?.username &&
            user?.username &&
            !event.participants.includes(user?.username) && !event.invitedPlayers?.includes(user?.username) &&
            !isEventFull && (
              <button
                onClick={handleJoinEvent}
                className={`bg-cyan-500 hover:bg-cyan-600 transition duration-300 rounded-lg py-2 px-4 text-white ${
                    event.joinRequests.includes(user?.username)
                        ? "bg-gray-700 animate-pulse"
                        : ""
                }`}
                disabled={event.joinRequests.includes(user?.username)}
              >
                {event.joinRequests.includes(user?.username)
                    ? "Anmodning sendt"
                    : "Tilmeld arrangement"}
              </button>
            )}

          {event.username === user?.username && (
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
                  className="hidden flex justify-center bg-green-500 hover:bg-green-600 transition duration-300 rounded-lg py-2 px-4 text-white"
                >
                  {!copied ? (
                    <>
                      <DocumentDuplicateIcon className="h-5" />
                      <h1>Kopier arrangementslink</h1>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5" />
                      <h1>Link kopieret!</h1>
                    </>
                  )}
                </div>

                <button
                  onClick={handleDeleteEvent}
                  className="bg-red-500 hover:bg-red-600 transition duration-300 rounded-lg py-2 px-4 text-white"
                >
                  Slet arrangement
                </button>
              </div>
            </>
          )}
        </div>
      </Animation>
    </>
  );
};

export default ViewEventPage;
