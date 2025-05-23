import Animation from "../../../components/misc/Animation";
import { Outlet, useNavigate } from "react-router-dom";
import PrivateEventTabMenu from "../../../components/private-event/PrivateEventTabMenu.tsx";
import { useEffect, useState } from "react";
import communityApi from "../../../services/makkerborsService.ts";
import { useUser } from "../../../context/UserContext.tsx";
import mockEvents from "../../../utils/mock/mockEvents.ts";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../../components/misc/LoadingSpinner.tsx";

export const PrivateEventPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [joinRequestsCount, setJoinRequestsCount] = useState(0);
  const [showClosedEvents, setShowClosedEvents] = useState(false);

  const useMockData = false;

  useEffect(() => {
    const fetchJoinRequestsCount = async () => {
      if (!user?.username) return;
      if (useMockData) {
        const total = mockEvents
          .filter((e) => e.username === user?.username)
          .reduce((sum, t) => sum + t.joinRequests.length, 0);
        setJoinRequestsCount(total);
      } else {
        try {
          const tournaments = await communityApi.getPrivateEventsForUser(
            user?.username
          );
          if (!tournaments || tournaments.length === 0) {
            return;
          }
          const filteredTournaments = tournaments.filter(
            (t) => new Date(t.eventDateTime) > new Date()
          );
          const total = filteredTournaments.reduce(
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
  }, [useMockData, user]);

  if (loading) {
    return (
      <>
        <div className="w-full h-[calc(100vh-150px)] flex justify-center items-center">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      <Animation>
        <div className="sm:mx-20 my-10">
          <div className="flex justify-center mb-5">
            <PrivateEventTabMenu joinRequestsCount={joinRequestsCount} />
          </div>

          <div className="flex justify-between items-center max-sm:mt-5 mx-4 mb-4">
            <button
              onClick={() => navigate("opretarrangement")}
              className="w-full bg-slate-700 rounded-lg py-2 px-4 text-cyan-500"
            >
              Opret arrangement
            </button>
          </div>

          <div className="flex justify-between items-center max-sm:mt-5 mx-4 mb-4">
            <div
              onClick={() => setShowClosedEvents((prevState) => !prevState)}
              className={`flex items-center gap-1 ${
                !location.pathname.includes("allearrangementer") ? "hidden" : ""
              }`}
            >
              {showClosedEvents ? (
                <LockClosedIcon className="h-5 w-5 text-yellow-500" />
              ) : (
                <LockOpenIcon className="h-5 w-5 text-yellow-500" />
              )}

              <label htmlFor="showClosedEvents" className="text-gray-500">
                {!showClosedEvents ? "Vis" : "Skjul"} lukkede arrangementer
              </label>
            </div>
          </div>

          <div className="mx-4">
            <Outlet context={{ showClosedEvents }} />
          </div>
        </div>
      </Animation>
    </>
  );
};

export default PrivateEventPage;
