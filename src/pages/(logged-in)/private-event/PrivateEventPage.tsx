import HomeBar from "../../../components/misc/HomeBar";
import Animation from "../../../components/misc/Animation";
import { Outlet, useNavigate } from "react-router-dom";
import PrivateEventTabMenu from "../../../components/private-event/PrivateEventTabMenu.tsx";
import {useEffect, useState} from "react";
import communityApi from "../../../services/makkerborsService.ts";
import { useUser } from "../../../context/UserContext.tsx";
import mockEvents from "../../../utils/mockEvents.ts";


export const PrivateEventPage = () => {
    const navigate = useNavigate();
    const { username } = useUser();
    const [joinRequestsCount, setJoinRequestsCount] = useState(0);
    const [showClosedEvents, setShowClosedEvents] = useState(false);


    const useMockData = true;

    useEffect(() => {
        const fetchJoinRequestsCount = async () => {
            if (useMockData) {
                const total = mockEvents.filter(e => e.username === username)
                    .reduce(
                    (sum, t) => sum + t.joinRequests.length,
                    0
                );
                setJoinRequestsCount(total);
            } else {
                try {
                    const tournaments = await communityApi.getPrivateEventsForUser(username!);
                    const total = tournaments.reduce(
                        (sum: number, t: any) => sum + (t.joinRequests?.length || 0),
                        0
                    );
                    setJoinRequestsCount(total);
                } catch (err) {
                    console.error("Fejl ved hentning af joinRequests:", err);
                }
            }
        };

        fetchJoinRequestsCount().then();
    }, [useMockData, username]);



    return (
        <Animation>
            <HomeBar backPage="/hjem"/>
            <div className="sm:mx-20 my-10">
                <div className="justify-self-center mb-5">
                    <PrivateEventTabMenu joinRequestsCount={joinRequestsCount} />
                </div>

                <div className="flex justify-between items-center max-sm:mt-5 mx-4 mb-4">
                    <button
                        onClick={() => navigate("opretarrangement")}
                        className="bg-cyan-500 rounded px-2 py-2 text-white text-sm"
                    >
                        Opret arrangement
                    </button>

                    <div className={`flex items-center gap-1 ${!location.pathname.includes("allearrangementer") ? "hidden" : ""}`}>
                        <input
                            className=""
                            type="checkbox"
                            id="showClosedEvents"
                            name="showClosedEvents"
                            checked={showClosedEvents}
                            onChange={(e) => setShowClosedEvents(e.target.checked)}
                        />

                        <label htmlFor="showClosedEvents" className="text-gray-500 text-sm">
                            Vis lukkede arrangementer
                        </label>
                    </div>
                </div>

                <div className="mx-4">
                    <Outlet context={{showClosedEvents}}/>
                </div>
            </div>
        </Animation>
    );
};

export default PrivateEventPage;