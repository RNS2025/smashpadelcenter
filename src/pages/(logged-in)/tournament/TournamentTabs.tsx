import {Helmet} from "react-helmet-async";
import HomeScreenCard from "../../../components/HomeScreen/HomeScreenCard.tsx";
import {CheckCircleIcon, MapIcon} from "@heroicons/react/24/outline";
import Animation from "../../../components/misc/Animation.tsx";
import HomeBar from "../../../components/misc/HomeBar.tsx";

export const TournamentTabs = () => {


    return (
        <>
            <Helmet>
                <title>Turneringer</title>
            </Helmet>

            <Animation>
            <HomeBar />

            <div className="flex items-center justify-center min-h-screen -mt-20 overflow-y-hidden">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
                    <HomeScreenCard
                        icon={<CheckCircleIcon className="h-10 w-10" aria-hidden="true" />}
                        title="Indtjekning"
                        description="Tjek ind til DPF-turneringer"
                        link="/turneringer/check-in"
                    />
                    <HomeScreenCard
                        icon={<MapIcon className="h-10 w-10" aria-hidden="true" />}
                        title="Baneoversigt"
                        description="Se hvor kampene bliver afviklet"
                        link="/turneringer/baneoversigt"
                    />
                </div>
            </div>
            </Animation>

        </>
    );
};

export default TournamentTabs;