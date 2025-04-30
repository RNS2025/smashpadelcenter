import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Animation from "../../../components/misc/Animation.tsx";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import "react-datepicker/dist/react-datepicker.css";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MatchFinderTabMenu from "../../../components/matchFinder/MatchFinderTabMenu.tsx";
import { useUser } from "../../../context/UserContext";
import communityApi from "../../../services/makkerborsService";
import {
  LockClosedIcon,
  LockOpenIcon,
  NumberedListIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../../components/misc/LoadingSpinner.tsx";

export const MatchFinderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useUser();
  const [joinRequestsCount, setJoinRequestsCount] = useState(0);
  const [showFullMatches, setShowFullMatches] = useState(false);
  const [isMyLevel, setIsMyLevel] = useState(false);

  useEffect(() => {
    const fetchJoinRequestCount = async () => {
      try {
        const data = await communityApi.getMatches();
        const myMatches = data
          .filter((match) => match.username === user?.username)
          .filter((match) => new Date(match.matchDateTime) > new Date());
        const totalJoinRequests = myMatches.reduce(
          (sum, match) => sum + (match.joinRequests?.length || 0),
          0
        );
        setJoinRequestsCount(totalJoinRequests);
      } catch (err) {
        console.error("Kunne ikke hente join requests", err);
      }
    };

    fetchJoinRequestCount().then();
  }, [user?.username]);

  if (loading) {
    return <LoadingSpinner />; // Vis en indlæsningsindikator eller returner null
  }

  if (!isAuthenticated) {
    return <Redirect to="/turneringer" />;
  }

  return (
    <>
      <Helmet>
        <title>Makkerbørs</title>
      </Helmet>

      <HomeBar backPage="/hjem" />
      <Animation>
        <div className="sm:mx-20 my-10">
          <div className="justify-self-center mb-5">
            <MatchFinderTabMenu joinRequestsCount={joinRequestsCount} />
          </div>
          <div className="flex justify-between items-center max-sm:mt-5 mx-4 mb-4">
            <button
              onClick={() => navigate("opretkamp")}
              className="bg-cyan-500 rounded px-2 py-2 text-white"
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
                <NumberedListIcon className="h-5 w-5 text-yellow-500" />
              ) : (
                <NumberedListIcon className="h-5 w-5 text-gray-500" />
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
