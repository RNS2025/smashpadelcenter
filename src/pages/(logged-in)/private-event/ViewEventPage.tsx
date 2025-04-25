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
  CheckIcon,
  DocumentDuplicateIcon,
  MapPinIcon,
  UserCircleIcon,
  UserGroupIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import mockEvents from "../../../utils/mockEvents.ts";
import userProfileService from "../../../services/userProfileService.ts";

export const ViewEventPage = () => {
  const { user } = useUser();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<PrivateEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantProfiles, setParticipantProfiles] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);

  const [copied, setCopied] = useState(false);

  const useMockData = false;

  useEffect(() => {
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
        const fetched = await communityApi.getEventById(eventId!);
        setEvent(fetched);
      } catch (err) {
        console.error("Fejl ved hentning af event:", err);
        setError("Kunne ikke hente event");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent().then();
  }, [eventId, useMockData]);

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
      alert("Tilmelding sendt!");
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
      alert("Tilmelding bekræftet!");
      setEvent(updatedEvent);
    } catch (error: any) {
      console.error("Error confirming join:", error);
      alert(error.response?.data?.message || "Fejl ved bekræftelse");
      setError("Fejl ved bekræftelse");
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    try {
      await communityApi.deleteEvent(event.id);
      alert("Arrangement slettet!");
      window.history.back();
    } catch (error: any) {
      console.error("Error deleting event:", error);
      alert(
        error.response?.data?.message || "Fejl ved sletning af arrangement"
      );
      setError("Fejl ved sletning af arrangement");
    }
  };

  const handleInvitePlayers = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 10000);
    } catch (err) {
      console.error("Kunne ikke kopiere link:", err);
    }
  };

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
        className={`min-h-screen fixed inset-0 z-50 bg-black bg-opacity-10 flex items-center justify-center ${
          !infoDialogVisible ? "hidden" : ""
        }`}
      >
        <PlayerInfoDialog user={selectedUser!} />
      </div>

      <div
        onClick={() => setInfoDialogVisible(false)}
        className={`min-h-screen fixed inset-0 z-50 bg-gray-500 bg-opacity-90 flex items-center justify-center ${
          !infoDialogVisible ? "hidden" : ""
        }`}
      >
        <PlayerInfoDialog user={selectedUser!} />
      </div>

      <Animation>
        <HomeBar />

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

          {/* Event creator */}
          <div className="border rounded flex items-center px-1">
            <UserCircleIcon className="h-20" />
            <div className="w-full pr-1 truncate">
              <h1>{event.username}</h1>
            </div>
            <div className="bg-cyan-500 text-white rounded-full flex items-center justify-center w-20 h-12">
              2.5
            </div>
          </div>

          {/* Participants */}
          {participantProfiles
            .filter((p) => p.username !== event.username)
            .map((profile) => (
              <div
                onClick={() => {
                  setSelectedUser(profile);
                  setInfoDialogVisible(true);
                }}
                key={profile.username}
                className="border rounded flex items-center px-1"
              >
                <UserCircleIcon className="h-20" />
                <div className="w-full pr-1 truncate">
                  <h1>{profile.username}</h1>
                </div>
                <div className="bg-cyan-500 text-white rounded-full flex items-center justify-center w-20 h-12">
                  {profile.skillLevel.toFixed(1)}
                </div>
              </div>
            ))}

          {/* Empty spots */}
          {[...Array(event.totalSpots - event.participants.length)].map(
            (_, index) => (
              <div
                key={`empty-${index}`}
                className="border border-gray-500 rounded flex items-center px-1"
              >
                <UserCircleIcon className="h-20 text-gray-500" />
                <div className="w-full pr-1 truncate">
                  <h1 className="text-xl text-gray-500">Ledig plads</h1>
                </div>
                <div className="bg-gray-500 text-white rounded-full flex items-center justify-center w-20 h-12">
                  ?
                </div>
              </div>
            )
          )}

          {/* Join requests (visible to creator) */}
          {event.username === user?.username &&
            Array.isArray(event.joinRequests) &&
            event.joinRequests.length > 0 && (
              <>
                <h2 className="font-semibold">Tilmeldingsanmodninger</h2>
                {event.joinRequests.map((requester, index) => (
                  <div
                    key={index}
                    className="border rounded flex items-center px-1"
                  >
                    <UserCircleIcon className="h-20" />
                    <div className="w-full pr-1 truncate">
                      <h1>{requester}</h1>
                      <h1 className="text-gray-500">Afventer bekræftelse</h1>
                    </div>
                    <button
                      onClick={() => handleConfirmJoin(requester)}
                      className="bg-cyan-500 text-white rounded-lg px-2 py-1"
                      disabled={isEventFull}
                    >
                      Bekræft
                    </button>
                  </div>
                ))}
              </>
            )}

          <div className="grid grid-cols-2 text-center text-black gap-3">
            <div className="bg-white rounded flex justify-center items-center gap-1 py-4">
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

            <div className="bg-white rounded flex justify-center items-center gap-1 py-4">
              <UserGroupIcon className="h-6 rounded-lg text-white bg-gradient-to-b from-sky-400 to-pink-400" />
              <h1 className="h-5 truncate overflow-hidden whitespace-nowrap max-w-[100px]">
                {event.eventFormat}
              </h1>
            </div>
          </div>

          <div className="bg-white rounded w-full text-black p-4 flex flex-col gap-2">
            <h1 className="font-semibold">Bemærkninger</h1>
            <p>{event.description || "Ingen bemærkninger."}</p>
          </div>

          {/* Action buttons */}
          {event.username !== user?.username &&
            user?.username &&
            !event.participants.includes(user?.username) &&
            !event.joinRequests.includes(user?.username) &&
            !isEventFull && (
              <button
                onClick={handleJoinEvent}
                className="bg-cyan-500 hover:bg-cyan-600 transition duration-300 rounded-lg py-2 px-4 text-white"
              >
                Tilmeld arrangement
              </button>
            )}

          {event.username === user?.username && (
            <div className="flex justify-between">
              <button
                onClick={handleDeleteEvent}
                className="bg-red-500 hover:bg-red-600 transition duration-300 rounded-lg py-2 px-4 text-white"
              >
                Slet arrangement
              </button>

              <div
                onClick={handleInvitePlayers}
                className="bg-green-500 hover:bg-green-600 transition duration-300 rounded-lg py-2 px-4 text-white flex"
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
            </div>
          )}
        </div>
      </Animation>
    </>
  );
};

export default ViewEventPage;
