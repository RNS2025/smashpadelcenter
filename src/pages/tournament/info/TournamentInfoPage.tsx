import { Helmet } from "react-helmet-async";
import Animation from "../../../components/misc/Animation.tsx";
import TournamentInfoTabMenu from "../../../components/tournaments/info/TournamenInfoTabMenu.tsx";
import { Outlet } from "react-router-dom";

export const TournamentInfoPage = () => {
  return (
    <>
      <Helmet>
        <title>Turneringsregler</title>
      </Helmet>

      <Animation>
        <div className="flex justify-center my-10">
          <TournamentInfoTabMenu />
        </div>

        <div className="flex justify-center my-2">
          <Outlet />
        </div>
      </Animation>
    </>
  );
};

export default TournamentInfoPage;
