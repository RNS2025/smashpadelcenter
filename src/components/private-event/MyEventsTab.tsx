import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { PrivateEvent } from "../../types/PrivateEvent.ts";
import communityApi from "../../services/makkerborsService.ts";
import { useUser } from "../../context/UserContext.tsx";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import {
  QuestionMarkCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { safeFormatDate } from "../../utils/dateUtils.ts";
import mockEvents from "../../utils/mock/mockEvents.ts";
import usePolling from "../../hooks/usePolling.ts";

export const MyEventsTab = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [privateEvents, setPrivateEvents] = useState<PrivateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [isPageVisible, setIsPageVisible] = useState(true);

  const useMockData = false;

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Polling for private events
  const fetchPrivateEvents = async () => {
    if (!user || !user.username) {
      throw new Error("User not authenticated");
    }

    let filteredEvents: PrivateEvent[];
    if (useMockData) {
      filteredEvents = mockEvents
        .filter(
          (e) =>
            new Date(e.eventDateTime) > new Date() &&
            (e.username === user.username ||
              e.participants.includes(user.username) ||
              e.invitedPlayers?.includes(user.username))
        )
        .sort((a, b) => {
          return (
            new Date(a.eventDateTime).getTime() -
            new Date(b.eventDateTime).getTime()
          );
        });
    } else {
      const response = await communityApi.getPrivateEvents();
      filteredEvents = response
        .filter(
          (e: PrivateEvent) =>
            new Date(e.eventDateTime) > new Date() &&
            (e.username === user.username ||
              e.participants.includes(user.username) ||
              e.invitedPlayers?.includes(user.username))
        )
        .sort((a: PrivateEvent, b: PrivateEvent) => {
          return (
            new Date(a.eventDateTime).getTime() -
            new Date(b.eventDateTime).getTime()
          );
        });
    }
    return filteredEvents;
  };

  usePolling(
    fetchPrivateEvents,
    (events) => {
      setPrivateEvents(events);
      setLoading(false);
    },
    {
      interval: 10000, // Poll every 10 seconds
      enabled: !userLoading && !!user?.username && isPageVisible,
    }
  );

  // Handle unauthenticated user
  useEffect(() => {
    if (userLoading) return;

    if (!user || !user.username) {
      console.warn("User not authenticated, redirecting to login");
      navigate("/");
      setLoading(false);
    }
  }, [userLoading, user, navigate]);

  if (userLoading || loading) {
    return (
        <>
            <div className="w-full flex justify-center items-center">
            <LoadingSpinner />
            </div>
        </>
    )
  }

  if (error) {
    return (
      <div>
        {error}
        {error.includes("Adgang nægtet") && (
          <button
            onClick={() => navigate("/")}
            className="mt-4 bg-cyan-500 text-white rounded px-4 py-2"
          >
            Log ind
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
        <>
          <div className="w-full flex justify-center items-center">
            <LoadingSpinner />
          </div>
        </>
    )
  }

  return (
    <>
      <Helmet>
        <title>Mine arrangementer</title>
      </Helmet>

      <div className="text-sm cursor-pointer">
        {privateEvents.length === 0 ? (
            <div className="border p-4 rounded-lg space-y-1.5 mb-5">
              <p className="text-center py-4 font-semibold">Ingen aktuelle arrangementer at vise.</p>
            </div>
        ) : (
          privateEvents.map((event) => (
            <div
              onClick={() =>
                navigate(`/privat-arrangementer/${event.id}`)
              }
              key={event.id}
              className={`border p-4 rounded-lg space-y-1.5 mb-5`}
            >
              <h1 className="font-semibold text-lg">{event.title}</h1>
              <h1>
                {safeFormatDate(
                  event.eventDateTime,
                  "EEEE | dd. MMMM | HH:mm"
                ).toUpperCase()}{" "}
                - {safeFormatDate(event.endTime, "HH:mm")}
              </h1>
              <div className="border-b border-gray-600">
                <p>{event.location}</p>
              </div>

              {!event.level && event.joinRequests.length === 0 ? (
                <div className="flex flex-col gap-y-2">
                  <div className="flex justify-between">
                    <p>{event.eventFormat}</p>
                    <div className="flex items-center gap-1">
                      <UserCircleIcon
                        className={`h-5 ${
                          event.participants.length === event.totalSpots
                            ? "text-cyan-500"
                            : "text-gray-500"
                        }`}
                      />
                      <p className="h-4">
                        {event.participants.length}/{event.totalSpots}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <p className="text-gray-500 italic">
                      Oprettet af{" "}
                      {event.username === user?.username
                        ? "dig"
                        : `${event.username}`}
                    </p>
                    <p className="text-gray-500 italic">
                      {event.openRegistration
                        ? "Åben tilmelding"
                        : "Lukket tilmelding"}
                    </p>
                  </div>
                  {user && event.invitedPlayers?.includes(user?.username) && (
                    <div className="flex justify-between">
                      <p className="text-yellow-500 italic">
                        Du er inviteret til dette arrangement
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-y-2">
                  <div className="flex justify-between">
                    {event.joinRequests.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <QuestionMarkCircleIcon
                          className={`h-5 text-yellow-500 ${
                            event.username === user?.username
                              ? "animate-pulse"
                              : ""
                          }`}
                        />
                        <p>
                          {event.joinRequests.length}{" "}
                          {event.joinRequests.length === 1
                            ? "anmodning"
                            : "anmodninger"}
                        </p>
                      </div>
                    ) : (
                      <span></span>
                    )}
                    <div className="flex items-center gap-1">
                      <UserCircleIcon
                        className={`h-5 ${
                          event.participants.length === event.totalSpots
                            ? "text-cyan-500"
                            : "text-gray-500"
                        }`}
                      />
                      <p>
                        {event.participants.length}/{event.totalSpots}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <p>{event.level ? `Niveau ${event.level}` : ""}</p>
                    <p>{event.eventFormat}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-500 italic">
                      Oprettet af{" "}
                      {event.username === user?.username
                        ? "dig"
                        : `${event.username}`}
                    </p>
                    <p className="text-gray-500 italic">
                      {event.openRegistration
                        ? "Åben tilmelding"
                        : "Lukket tilmelding"}
                    </p>
                  </div>
                  {user && event.invitedPlayers?.includes(user?.username) && (
                      <div className="flex justify-between">
                        <p className="text-yellow-500 italic">
                          Du er inviteret til dette arrangement
                        </p>
                      </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default MyEventsTab;
