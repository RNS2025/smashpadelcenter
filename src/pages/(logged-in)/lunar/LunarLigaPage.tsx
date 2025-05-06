import { Helmet } from "react-helmet-async";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import LunarTabMenu from "../../../components/lunar/LunarTabMenu.tsx";
import { Outlet } from "react-router-dom";
import Animation from "../../../components/misc/Animation.tsx";

const LunarLigaPage = () => {

  return (
      <>
      <Helmet>
        <title>Lunar Ligaen</title>
      </Helmet>

        <HomeBar backPage={"/hjem"}/>
          <Animation>

        <div className="flex justify-center my-10">
        <LunarTabMenu/>
        </div>

              <Outlet />
          </Animation>
      </>
  );
};

export default LunarLigaPage;
