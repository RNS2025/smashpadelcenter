import { FC, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Animation from "../../../components/misc/Animation.tsx";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import "react-datepicker/dist/react-datepicker.css";
import { Outlet, useNavigate } from "react-router-dom";
import MatchFinderTabMenu from "../../../components/matchFinder/MatchFinderTabMenu.tsx";
import { useUser } from "../../../context/UserContext";
import communityApi from "../../../services/makkerborsService";

const MatchFinderPage: FC = () => {
  const navigate = useNavigate();
  const { username } = useUser();
  const [joinRequestsCount, setJoinRequestsCount] = useState(0);

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
            <button
                onClick={() => navigate("opretkamp")}
                className="max-sm:mt-5 mx-4 bg-cyan-500 rounded px-4 py-2 text-white mb-4"
            >
              Opret kamp
            </button>

            <div className="mx-4">
              <Outlet />
            </div>
          </div>
        </Animation>
      </>
  );
};

export default MatchFinderPage;
