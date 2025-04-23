import {Helmet} from "react-helmet-async";
import {useNavigate, useOutletContext} from "react-router-dom";
import {useUser} from "../../context/UserContext.tsx";
import {useEffect, useState} from "react";
import {PrivateEvent} from "../../types/PrivateEvent.ts";
import mockEvents from "../../utils/mockEvents.ts";
import communityApi from "../../services/makkerborsService.ts";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import {safeFormatDate} from "../../utils/dateUtils.ts";
import {QuestionMarkCircleIcon, UserCircleIcon} from "@heroicons/react/24/outline";

type OutletContextType = {
    showClosedEvents: boolean;
}

export const AllEventsTab = () => {
    const navigate = useNavigate();
    const {showClosedEvents} = useOutletContext<OutletContextType>();
    const {username} = useUser();
    const [privateEvents, setPrivateEvents] = useState<PrivateEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const useMockData = true;

    useEffect(() => {
        if (useMockData) {
            setPrivateEvents(mockEvents);
            setLoading(false);
            return;
        }

        const fetchPrivateEvents = async () => {
            try {
                const response = await communityApi.getPrivateEvents();
                setPrivateEvents(response);
            } catch (err) {
                console.error("Fejl ved hentning af arrangementer:", err);
                setError("Kunne ikke hente arrangementer");
            } finally {
                setLoading(false);
            }
        };

        fetchPrivateEvents().then();
    }, [useMockData]);




    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const visibleEvents = privateEvents.filter(e =>
        e.openRegistration || showClosedEvents
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
                    visibleEvents.map((event) => (
                        <div
                            onClick={() => navigate(`/privat-arrangementer/${event.username}/${event.id}`)}
                            key={event.id}
                            className={`border p-4 rounded-lg space-y-1.5 hover:bg-gray-700 mb-5
                                 ${new Date(event.eventDateTime) < new Date() ? "opacity-70" : ""}`}
                        >
                            <h1 className="font-semibold text-lg">
                                {event.title}
                            </h1>
                            <h1>{safeFormatDate(event.eventDateTime, "EEEE | dd. MMMM | HH:mm").toUpperCase()} - {safeFormatDate(event.endTime, "HH:mm")}</h1>
                            <div className="border-b border-gray-600">
                                <p>{event.location}</p>
                            </div>
                            <div className="flex flex-col gap-y-2">
                                <div className="flex justify-between">
                                    {event.joinRequests.length > 0 ? (
                                        <div className="flex items-center gap-1">
                                            <QuestionMarkCircleIcon className="h-5 text-yellow-500"/>
                                            <p>{event.joinRequests.length} {event.joinRequests.length === 1 ? "anmodning" : "anmodninger"}</p>
                                        </div>
                                    ) : (
                                        <span></span>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <UserCircleIcon className={`h-5 ${event.participants.length === event.totalSpots ? "text-cyan-500" : "text-gray-500"}`}/>
                                        <p>{event.participants.length}/{event.totalSpots}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <p>Niveau {event.level}</p>
                                    <p>{event.eventFormat}</p>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-gray-500 italic">Oprettet af {event.username === username ? "dig" : `${event.username}`}</p>
                                    <p className="text-gray-500 italic">{event.openRegistration ? "Åben tilmelding" : "Lukket tilmelding"}</p>
                                </div>
                            </div>
                        </div>
                    )))}
            </div>
        </>
    );
};

export default AllEventsTab;