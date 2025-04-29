import {Helmet} from "react-helmet-async";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import Animation from "../../../components/misc/Animation.tsx";
import TournamentInfoTabMenu from "../../../components/tournaments/info/TournamenInfoTabMenu.tsx";
import { Outlet } from "react-router-dom";

export const TournamentInfoPage = () => {


    return (
        <>
            <Helmet>
                <title>Turneringsregler</title>
            </Helmet>

            <HomeBar backPage="/turneringer"/>
            <Animation>
                <div className="flex justify-center my-10">
                <TournamentInfoTabMenu />
                </div>


                <div className="my-2">
                    <Outlet />
                </div>
            </Animation>
        </>
    );
};

export default TournamentInfoPage;