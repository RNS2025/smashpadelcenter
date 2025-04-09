import {Helmet} from "react-helmet-async";
import HomeScreenCard from "../../../components/HomeScreen/HomeScreenCard.tsx";
import {CheckCircleIcon, MapIcon, RectangleGroupIcon} from "@heroicons/react/24/outline";
import Animation from "../../../components/misc/Animation.tsx";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import {useUser} from "../../../context/UserContext.tsx";

export const TournamentTabs = () => {
    const { role } = useUser();



    return (
        <>
            <Helmet>
                <title>Turneringer</title>
            </Helmet>

            <Animation>
            <HomeBar backPage="/hjem" />

            <div className="flex items-center justify-center min-h-screen -mt-20 overflow-y-hidden">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                    {role === "admin" && (
                    <HomeScreenCard
                        icon={<RectangleGroupIcon className="h-10 w-10" aria-hidden="true" />}
                        title="Resultater"
                        description="Indtast resultater for DPF-kampe"
                        link="/turneringer/resultater"
                    />
                    )}
                </div>
            </div>
            </Animation>

        </>
    );
};

export default TournamentTabs;