import { FC } from "react";
import { Helmet } from "react-helmet-async";
import Animation from "../../../components/misc/Animation.tsx";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import "react-datepicker/dist/react-datepicker.css";
import { Outlet, useNavigate } from "react-router-dom";
import MatchFinderTabMenu from "../../../components/matchFinder/MatchFinderTabMenu.tsx";

const MatchFinderPage: FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Makkerbørs</title>
      </Helmet>

      <Animation>
        <HomeBar backPage="/hjem" />

        <div className="sm:mx-20 my-10">
          <div className="justify-self-center mb-5">
            <MatchFinderTabMenu />
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
