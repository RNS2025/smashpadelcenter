import { Helmet } from "react-helmet-async";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useUser } from "../../context/UserContext.tsx";
import { useEffect, useState } from "react";
import { PrivateEvent } from "../../types/PrivateEvent.ts";
import mockEvents from "../../utils/mock/mockEvents.ts";
import communityApi from "../../services/makkerborsService.ts";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import { safeFormatDate } from "../../utils/dateUtils.ts";
import {
  QuestionMarkCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import usePolling from "../../hooks/usePolling.ts";

type OutletContextType = {
  showClosedEvents: boolean;
};

export const AllEventsTab = () => {
  const navigate = useNavigate();
  const { showClosedEvents } = useOutletContext<OutletContextType>();
  const { user } = useUser();
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
    let events: PrivateEvent[];
    if (useMockData) {
      events = mockEvents;
    } else {
      const response = await communityApi.getPrivateEvents();
      events = response.sort((a, b) => {
        return (
          new Date(a.eventDateTime).getTime() -
          new Date(b.eventDateTime).getTime()
        );
      });
    }
    return events;
  };

  usePolling(
    fetchPrivateEvents,
    (events) => {
      setPrivateEvents(events);
      setLoading(false);
    },
    {
      interval: 10000, // Poll every 10 seconds
      enabled: isPageVisible,
    }
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const visibleEvents = privateEvents.filter(
    (e) => e.openRegistration || showClosedEvents
  );

  return (
    <>
      <Helmet>
        <title>Alle arrangementer</title>
      </Helmet>

      <div className="text-sm cursor-pointer">
        {privateEvents.length === 0 ? (
          <p className="mt-10">Ingen aktuelle arrangementer at vise.</p>
        ) : (
          visibleEvents
            .filter(
              (e) =>
                e.username !== user?.username &&
                e.eventDateTime > new Date().toISOString() &&
                !(
                  e.invitedPlayers &&
                  user?.username &&
                  e.invitedPlayers.includes(user.username)
                )
            )
            .map((event) => (
              <div
                onClick={
                  event.openRegistration
                    ? () =>
                        navigate(
                          `/privat-arrangementer/${event.username}/${event.id}`
                        )
                    : undefined
                }
                key={event.id}
                className={`border p-4 rounded-lg space-y-1.5 hover:bg-gray-700 mb-5 ${
                  !event.openRegistration ? "opacity-50" : ""
                }`}
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
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </>
  );
};

export default AllEventsTab;
