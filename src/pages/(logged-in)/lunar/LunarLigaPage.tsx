import { Helmet } from "react-helmet-async";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import LunarTabMenu from "../../../components/lunar/LunarTabMenu.tsx";
import { Outlet } from "react-router-dom";

const LunarLigaPage = () => {

  return (
      <>
      <Helmet>
        <title>Lunar Ligaen</title>
      </Helmet>

        <HomeBar />

        <div className="justify-self-center mt-10">
        <LunarTabMenu/>
        </div>

        <Outlet />

      </>
  );
};

export default LunarLigaPage;
