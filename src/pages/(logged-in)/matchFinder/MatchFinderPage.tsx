import { FC, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Animation from "../../../components/misc/Animation.tsx";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import "react-datepicker/dist/react-datepicker.css";
import {Outlet, useLocation, useNavigate} from "react-router-dom";
import MatchFinderTabMenu from "../../../components/matchFinder/MatchFinderTabMenu.tsx";
import { useUser } from "../../../context/UserContext";
import communityApi from "../../../services/makkerborsService";

const MatchFinderPage: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = useUser();
  const [joinRequestsCount, setJoinRequestsCount] = useState(0);
    const [showFullMatches, setShowFullMatches] = useState(false);

  useEffect(() => {
    const fetchJoinRequestCount = async () => {
      try {
        const data = await communityApi.getMatches();
        const myMatches = data.filter(
            (match) => match.username === username
        );
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
  }, [username]);

  return (
      <>
        <Helmet>
          <title>Makkerbørs</title>
        </Helmet>

        <Animation>
          <HomeBar backPage="/hjem" />

          <div className="sm:mx-20 my-10">
            <div className="justify-self-center mb-5">
              <MatchFinderTabMenu joinRequestsCount={joinRequestsCount} />
            </div>
            <div className="flex justify-between items-center max-sm:mt-5 mx-4 mb-4">
            <button
                onClick={() => navigate("opretkamp")}
                className="bg-cyan-500 rounded px-2 py-2 text-white text-sm"
            >
              Opret kamp
            </button>

              <div className={`flex items-center gap-1 ${!location.pathname.includes("allekampe") ? "hidden" : ""}`}>
                <input
                    className=""
                    type="checkbox"
                    id="showFullMatches"
                    name="showFullMatches"
                    checked={showFullMatches}
                    onChange={(e) => setShowFullMatches(e.target.checked)}
                />

                <label htmlFor="showFullMatches" className="text-gray-500 text-sm">
                    Vis fyldte kampe
                </label>
              </div>
            </div>

            <div className="mx-4">
              <Outlet context={{showFullMatches}} />
            </div>
          </div>
        </Animation>
      </>
  );
};

export default MatchFinderPage;
