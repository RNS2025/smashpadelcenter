import { Helmet } from "react-helmet-async";
import HomeBar from "../../../components/misc/HomeBar";
import Animation from "../../../components/misc/Animation";
import { useUser } from "../../../context/UserContext.tsx";
import { Navigate, useNavigate, useParams } from "react-router-dom";
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
  CheckIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  StarIcon,
  UserCircleIcon,
  UserGroupIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import mockEvents from "../../../utils/mock/mockEvents.ts";
import userProfileService from "../../../services/userProfileService.ts";
import EventInvitePlayersDialog from "../../../components/private-event/misc/EventInvitePlayersDialog.tsx";
import { XIcon } from "lucide-react";
import { createICSFile, downloadICSFile } from "../../../utils/ICSFile.ts";
import Overlay from "../../../components/misc/Overlay.tsx";
import EventShowParticipantsDialog from "../../../components/private-event/misc/EventShowParticipantsDialog.tsx";

export const ViewEventPage = () => {
  const { user } = useUser();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<PrivateEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantProfiles, setParticipantProfiles] = useState<User[]>([]);
  const [joinRequestProfiles, setJoinRequestProfiles] = useState<User[]>([]);
  const [eventHost, setEventHost] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true)
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
      if (!updatedEvent || !Array.isArray(updatedEvent.participants)) {
        setError("Invalid event data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      setEvent(updatedEvent);
    } catch (error: any) {
      console.error("Error joining event:", error);
      setIsSubmitting(false)
      alert(error.response?.data?.message || "Fejl ved tilmelding");
      setError("Fejl ved tilmelding");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmJoin = async (participant: string) => {
    if (!event) return;
    try {
      const updatedEvent = await communityApi.confirmJoinEvent(
        event.id,
        participant
      );
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
      const userConfirmed = confirm(
        "Er du sikker på at du vil afvise tilmeldingen?"
      );
      if (userConfirmed) {
        const updatedEvent = await communityApi.confirmDeclinePrivateEvent(
          event.id,
          username
        );
        if (!updatedEvent || !Array.isArray(updatedEvent.participants)) {
          setError("Invalid event data returned");
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
      const userConfirmed = confirm(
        "Er du sikker på at du vil slette arrangementet?"
      );
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

  const handleRemovePlayerFromEvent = async (username: string) => {
    if (!event || !user?.username) return;
    try {
      const userConfirmed = confirm(
        "Er du sikker på at du vil fjerne spilleren?"
      );
      if (userConfirmed) {
        const updatedEvent = await communityApi.removePlayerFromEvent(
          event.id,
          username
        );
        setEvent(updatedEvent);
      }
    } catch (error: any) {
      console.error("Error removing player from event:", error);
      alert(error.response?.data?.message || "Fejl ved fjernelse");
      setError("Fejl ved fjernelse");
    }
  };

  const handleCancelJoinRequest = async (username: string) => {
    if (!event) return;
    try {
      const updatedEvent = await communityApi.playerCancelJoinEvent(
        event.id,
        username
      );
      if (!updatedEvent || !Array.isArray(updatedEvent.participants)) {
        setError("Invalid event data returned");
        alert("Der opstod en fejl – prøv igen.");
      }
      setEvent(updatedEvent);
    } catch (error: any) {
      console.error("Error cancelling join:", error);
      alert(error.response?.data?.message || "Fejl ved annullering");
      setError("Fejl ved annullering");
    }
  };

  if (!eventId) {
    return <Navigate to="/privat-arrangementer" replace />;
  }

  if (loading) {
    return (
      <>
        <HomeBar backPage="/hjem" />
        <div className="w-full h-[calc(100vh-150px)] flex justify-center items-center">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Helmet>
          <title>Detaljer for arrangement</title>
        </Helmet>
        <HomeBar backPage="/privat-arrangementer/minearrangementer"/>
        <Animation>
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

      <Overlay isVisible={infoDialogVisible}>
        <PlayerInfoDialog user={selectedUser!} />
      </Overlay>

      <Overlay isVisible={inviteDialogVisible}>
        <EventInvitePlayersDialog
          event={event}
          onInvite={async () => {
            setInviteDialogVisible(false);
            await communityApi.getEventById(eventId);
          }}
          onClose={() => {
            setInviteDialogVisible(false);
          }}
        />
      </Overlay>
      
      <Overlay isVisible={showParticipants}>
        <EventShowParticipantsDialog event={event} onClose={() => setShowParticipants(false)} />
      </Overlay>

      <HomeBar />
      <Animation>
        <div className="mx-4 my-10 space-y-4 text-sm">
          <h1 className="text-center font-semibold text-xl">{event.title}</h1>
          <h1
            className={`text-center font-semibold ${
              totalLength > 31
                ? "text-md"
                : totalLength > 37
                ? "text-sm"
                : "text-lg"
            }`}
          >
            {safeFormatDate(
              event.eventDateTime,
              "EEEE | dd. MMMM | HH:mm"
            ).toUpperCase()}{" "}
            - {safeFormatDate(event.endTime, "HH:mm")}
          </h1>


          {/* Participants */}
          {participantProfiles.slice(0, 1).map((profile) => (
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
                          className={`size-6 text-red-500 ${
                            event.username !== user?.username ? "hidden" : ""
                          }`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ))}

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
                          {requester.skillLevel.toFixed(1)}
                        </div>
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

          <div className="grid grid-cols-2 text-center text-gray-300 gap-3">
            <div
              className={`border-slate-800/80 bg-slate-800/80 rounded flex justify-center items-center gap-1 py-4 ${
                !event.level ? "hidden" : ""
              }`}
            >
              <BoltIcon className="h-6 text-yellow-500" />
              <h1 className="h-5">{event.level}</h1>
            </div>

            <div className="border-slate-800/80 bg-slate-800/80 rounded flex justify-center items-center gap-1 py-4">
              <MapPinIcon className="h-6 text-red-500" />
              <h1 className="h-5">{event.location.split(" ")[2]}</h1>
            </div>

            {event.courtBooked ? (
              <div className="border-slate-800/80 bg-slate-800/80 rounded flex justify-center items-center gap-1 py-4">
                <CheckCircleIcon className="h-6 rounded-lg text-green-500" />
                <h1 className="h-5">
                  {event.participants.length > 4 ? "Baner" : "Bane"} er booket
                </h1>
              </div>
            ) : (
              <div className="border-slate-800/80 bg-slate-800/80 rounded flex justify-center items-center gap-1 py-4">
                <XCircleIcon className="h-6 rounded-lg text-red-500" />
                <h1 className="h-5">Bane ikke booket</h1>
              </div>
            )}

            <div
              className={`border-slate-800/80 bg-slate-800/80 rounded flex justify-center items-center gap-1 py-4 ${
                !event.eventFormat ? "hidden" : ""
              }`}
            >
              <UserGroupIcon className="h-6 rounded-lg text-white bg-gradient-to-b from-sky-400 to-pink-400" />
              <h1 className="h-5 truncate overflow-hidden whitespace-nowrap max-w-[100px]">
                {event.eventFormat}
              </h1>
            </div>
          </div>

          <div className="border-slate-800/80 bg-slate-800/80 rounded w-full text-gray-300 p-4 flex justify-center gap-2 text-xl">
            <h1 className="font-semibold">Antal pladser:</h1>
            <h1>{event.participants.length} / {event.totalSpots}</h1>
          </div>

          {event.price && event.price > 0 && (
            <>
              <div
                onClick={() => {
                  if (eventHost?.phoneNumber) {
                    navigator.clipboard
                      .writeText(eventHost.phoneNumber)
                      .then(() => {
                        window.location.href = `mobilepay://`;
                      });
                  }
                }}
                className="border-slate-800/80 bg-slate-800/80 rounded flex flex-col justify-center items-center gap-2 py-4"
              >
                <div className="flex items-center">
                  <CurrencyDollarIcon className="size-10 rounded-lg text-yellow-600 bg-gradient-to-b" />
                  <h1 className="text-gray-300 text-lg truncate overflow-hidden whitespace-nowrap">
                    {event.price} kr.{" "}
                    {eventHost?.phoneNumber && `til ${eventHost.phoneNumber}`}
                  </h1>
                </div>
                <p
                  className={`text-gray-500 italic truncate overflow-hidden whitespace-nowrap ${
                    !eventHost?.phoneNumber ? "hidden" : ""
                  }`}
                >
                  Klik for at kopiere nummer og gå til MobilePay
                </p>
              </div>
            </>
          )}

          <div className="border-slate-800/80 bg-slate-800/80 rounded w-full text-gray-300 p-4 flex flex-col gap-2">
            <h1 className="font-semibold">Bemærkninger</h1>
            <p>{event.description || "Ingen bemærkninger."}</p>
          </div>

          {/* Action buttons */}

          <button
              onClick={() => setShowParticipants(true)}
              className="w-full bg-slate-700 rounded-lg py-2 px-4 text-yellow-500 text-lg"
          >
            Se deltagere
          </button>

          {user?.username &&
            event!.username !== user.username &&
            !event!.participants.includes(user.username) &&
            !event!.invitedPlayers?.includes(user.username) &&
            !isEventFull &&
            !event!.joinRequests.includes(user.username) && (
              <button
                onClick={handleJoinEvent}
                className="w-full bg-slate-700 rounded-lg py-2 px-4 text-cyan-500 text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Tilmelder..." : "Tilmeld arrangement"}
                  </button>
              )}

          {user?.username &&
            event!.username !== user.username &&
            event!.joinRequests.includes(user.username) && (
              <button
                onClick={() => handleCancelJoinRequest(user.username)}
                className="w-full bg-slate-700 rounded-lg py-2 px-4 text-red-500 text-lg"
              >
                Fjern tilmeldingsanmodning
              </button>
            )}
          {user && event?.participants.includes(user?.username) && (
            <button
              onClick={() => {
                const ics = createICSFile(
                  event!.title,
                  event!.description!,
                  event!.location,
                  new Date(event!.eventDateTime),
                  new Date(event!.endTime),
                  event!.participants
                );
                downloadICSFile(ics, `${event?.title}-${event!.id}.ics`);
              }}
              className="w-full bg-slate-700 rounded-lg py-2 px-4 text-cyan-500 text-lg"
            >
              Tilføj til kalender
            </button>
          )}
          {event.username === user?.username && (
            <>
              <div className="flex flex-col w-full gap-4 text-lg">
                <button
                  onClick={() => setInviteDialogVisible(true)}
                  className="w-full bg-slate-700 rounded-lg py-2 px-4 text-green-500 text-lg"
                >
                  Inviter spillere
                </button>

                <button
                  onClick={() => {
                    navigate(`/privat-arrangementer/${eventId}/rediger`);
                  }}
                  className="w-full bg-slate-700 rounded-lg py-2 px-4 text-orange-500 text-lg"
                >
                  Rediger arrangement
                </button>

                <button
                  onClick={handleDeleteEvent}
                  className="w-full bg-slate-700 rounded-lg py-2 px-4 text-red-500 text-lg"
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
