import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Animation from "../../../components/misc/Animation.tsx";
import "react-datepicker/dist/react-datepicker.css";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MatchFinderTabMenu from "../../../components/matchFinder/MatchFinderTabMenu.tsx";
import { useUser } from "../../../context/UserContext";
import communityApi from "../../../services/makkerborsService";
import {
  BoltIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../../components/misc/LoadingSpinner.tsx";
import usePolling from "../../../hooks/usePolling.ts";

export const MatchFinderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useUser();
  const [joinRequestsCount, setJoinRequestsCount] = useState(0);
  const [showFullMatches, setShowFullMatches] = useState(false);
  const [isMyLevel, setIsMyLevel] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

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

  // Polling for join request count
  const fetchJoinRequestCount = async () => {
    const data = await communityApi.getMatches();
    const myMatches = data
      .filter((match) => match.username === user?.username)
      .filter((match) => new Date(match.matchDateTime) > new Date());
    return myMatches.reduce(
      (sum, match) => sum + (match.joinRequests?.length || 0),
      0
    );
  };

  usePolling(
    fetchJoinRequestCount,
    (count) => {
      setJoinRequestsCount(count);
    },
    {
      interval: 10000, // Poll every 10 seconds
      enabled: isAuthenticated && !!user?.username && isPageVisible,
    }
  );

  if (loading) {
    return (
      <>
        <div className="w-full h-[calc(100vh-150px)] flex justify-center items-center">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Makkerbørs</title>
      </Helmet>

      <Animation>
        <div className="sm:mx-20 my-10">
          <div className="flex justify-center mb-5">
            <MatchFinderTabMenu joinRequestsCount={joinRequestsCount} />
          </div>
          <div className="flex justify-between items-center max-sm:mt-5 mx-4 mb-4">
            <button
              onClick={() => navigate("match/opretkamp")}
              className="w-full bg-slate-700 rounded-lg py-2 px-4 text-cyan-500"
            >
              Opret kamp
            </button>
          </div>

          <div className="flex flex-col max-sm:mt-5 mx-4 mb-4 gap-4">
            <div
              onClick={() => setShowFullMatches((prevState) => !prevState)}
              className={`flex items-center gap-1 ${
                !location.pathname.includes("allekampe") ? "hidden" : ""
              }`}
            >
              {showFullMatches ? (
                <LockClosedIcon className="h-5 w-5 text-yellow-500" />
              ) : (
                <LockOpenIcon className="h-5 w-5 text-yellow-500" />
              )}

              <label htmlFor="showClosedEvents" className="text-gray-500">
                {!showFullMatches ? "Vis" : "Skjul"} fyldte kampe
              </label>
            </div>

            <div
              onClick={() => setIsMyLevel((prevState) => !prevState)}
              className={`flex items-center gap-1 ${
                !location.pathname.includes("allekampe") ? "hidden" : ""
              }`}
            >
              {isMyLevel ? (
                <BoltIcon className="h-5 w-5 text-yellow-500" />
              ) : (
                <BoltIcon className="h-5 w-5 text-gray-500" />
              )}

              <label htmlFor="showClosedEvents" className="text-gray-500">
                {!isMyLevel
                  ? "Vis kun kampe inden for mit niveau"
                  : "Vis alle kampe"}
              </label>
            </div>
          </div>

          <div className="mx-4">
            <Outlet context={{ showFullMatches, isMyLevel }} />
          </div>
        </div>
      </Animation>
    </>
  );
};

export default MatchFinderPage;
