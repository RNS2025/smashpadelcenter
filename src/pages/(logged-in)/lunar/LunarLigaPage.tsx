import { Helmet } from "react-helmet-async";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import LunarTabs from "../../../components/lunar/LunarTabs.tsx";
import { Outlet } from "react-router-dom";

const LunarLigaPage = () => {

  return (
      <>
      <Helmet>
        <title>Lunar Ligaen</title>
      </Helmet>

        <HomeBar />

        <div className="justify-self-center mt-10">
        <LunarTabs/>
        </div>

        <Outlet />

      </>
  );
};

export default LunarLigaPage;
