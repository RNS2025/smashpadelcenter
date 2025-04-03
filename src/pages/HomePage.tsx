import { Helmet } from "react-helmet-async";
import HomeBar from "../components/HomeBar";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";
import Animation from "../components/misc/Animation";
import HomeScreenCard from "../components/HomeScreen/HomeScreenCard.tsx";
import {AcademicCapIcon, ChartBarIcon, NumberedListIcon, TrophyIcon, UsersIcon} from "@heroicons/react/24/outline";

export const HomePage = () => {
  const { role, refreshUser } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // If role is not authenticated, try refreshing the user data
    if (!role && !isRefreshing) {
      setIsRefreshing(true);
      refreshUser()
        .then(() => {
          setIsRefreshing(false);
        })
        .catch(() => {
          setIsRefreshing(false);
        });
    }
  }, [role, isRefreshing, refreshUser]);

  return (
    <>
      <Helmet>
        <title>Hjem</title>
      </Helmet>

        <Animation>
            <HomeBar />


            <div className="flex h-screen -mt-20 items-center justify-center">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">

                    <HomeScreenCard
                        icon={<ChartBarIcon className="h-10 w-10" aria-hidden="true"/>}
                        title="Adminpanel"
                        description="Tilgå adminpanel og dets funktionaliteter"
                        link="/admin"
                        disabled={role !== "admin"}
                    />

                    <HomeScreenCard
                        icon={<TrophyIcon className="h-10 w-10" aria-hidden="true"/>}
                        title="DPF-turneringer"
                        description="Find og tilmeld dig DPF-turneringer"
                        link="/check-in"
                        disabled={role !== "admin"}
                    />

                    <HomeScreenCard
                        icon={<UsersIcon className="h-10 w-10" aria-hidden="true"/>}
                        title="Makkerbørs"
                        description="Søg med- og modspillere"
                        link="/admin"
                        disabled={role !== "admin"}
                    />

                    <HomeScreenCard
                        icon={<NumberedListIcon className="h-10 w-10" aria-hidden="true"/>}
                        title="Rangliste"
                        description="Stryg hele vejen til tops i ranglisten"
                        link="/admin"
                        disabled={role !== "admin"}
                    />

                    <HomeScreenCard
                        icon={<AcademicCapIcon className="h-10 w-10" aria-hidden="true"/>}
                        title="Træning"
                        description="Find og tilmeld dig træninger"
                        link="/admin"
                        disabled={role !== "admin"}
                    />

                    <HomeScreenCard
                        icon={<ChartBarIcon className="h-10 w-10" aria-hidden="true"/>}
                        title="Et eller andet"
                        description="Et eller andet"
                        link="/admin"
                        disabled={role !== "admin"}
                    />
                </div>
            </div>
        </Animation>
    </>
  );
};

export default HomePage;
