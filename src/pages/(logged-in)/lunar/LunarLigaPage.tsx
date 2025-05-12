import { Helmet } from "react-helmet-async";
import LunarTabMenu from "../../../components/lunar/LunarTabMenu.tsx";
import { Outlet, useLocation } from "react-router-dom";
import Animation from "../../../components/misc/Animation.tsx";
import { useEffect } from "react";

const LunarLigaPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/holdligaer/")) {
      sessionStorage.setItem("lastLigaTab", location.pathname);
    }
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Lunar Ligaen</title>
      </Helmet>
      <Animation>
        <div className="flex justify-center my-5">
          <LunarTabMenu />
        </div>

        <Outlet />
      </Animation>
    </>
  );
};

export default LunarLigaPage;
