import {useEffect, useState} from "react";
import {Helmet} from "react-helmet-async";
import {PrivateEvent} from "../../types/PrivateEvent.ts";
import communityApi from "../../services/makkerborsService.ts";
import { useUser } from "../../context/UserContext.tsx";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import {QuestionMarkCircleIcon, UserCircleIcon} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { safeFormatDate } from "../../utils/dateUtils.ts";
import mockEvents from "../../utils/mockEvents.ts";

export const MyEventsTab = () => {
    const navigate = useNavigate();
    const {user} = useUser();
    const [privateEvents, setPrivateEvents] = useState<PrivateEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const useMockData = true;

    useEffect(() => {
        if (useMockData) {
            setPrivateEvents(mockEvents.filter(e => e.participants.includes(user?.username as string)).sort((a, b) => {
                return new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime();
            }));
            setLoading(false);
            return;
        }

        const fetchPrivateEvents = async () => {
            try {
                const response = await communityApi.getPrivateEventsForUser(user!.username!);
                setPrivateEvents(response);
            } catch (err) {
                console.error("Fejl ved hentning af arrangementer:", err);
                setError("Kunne ikke hente arrangementer");
            } finally {
                setLoading(false);
            }
        };

        fetchPrivateEvents().then();
    }, [useMockData, user, user?.username]);


    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div>{error}</div>;
    }


    return (
        <>
            <Helmet>
                <title>Mine arrangementer</title>
            </Helmet>

            <div className="text-sm cursor-pointer">
                {privateEvents.length === 0 ? (
                    <p className="mt-10">Ingen aktuelle arrangementer at vise.</p>
                ) : (
                    privateEvents.map((event) => (
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
                                            <QuestionMarkCircleIcon className={`h-5 text-yellow-500 ${event.username === user?.username ? "animate-pulse" : ""}`}/>
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
                                    <p className="text-gray-500 italic">Oprettet af {event.username === user?.username ? "dig" : `${event.username}`}</p>
                                    <p className="text-gray-500 italic">{event.openRegistration ? "Åben tilmelding" : "Lukket tilmelding"}</p>
                                    </div>
                                </div>
                            </div>
                        )))}
            </div>

        </>
    );
};

export default MyEventsTab;