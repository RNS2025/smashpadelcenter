import { Helmet } from "react-helmet-async";
import HomeScreenCard from "../../components/HomeScreen/HomeScreenCard.tsx";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  MapIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
import Animation from "../../components/misc/Animation.tsx";
import HomeBar from "../../components/misc/HomeBar.tsx";
import { useUser } from "../../context/UserContext.tsx";

export const TournamentTabs = () => {
  const { user } = useUser();

  return (
    <>
      <Helmet>
        <title>Turneringer</title>
      </Helmet>

      <HomeBar backPage="/hjem" />
      <Animation>
        <div className="flex my-5 items-center justify-center">
          <div
            className={`grid grid-cols-1 gap-8 sm:grid-cols-2 ${
              user?.role === "admin" ? "lg:grid-cols-3" : "lg:grid-cols-2"
            }`}
          >
            <HomeScreenCard
              icon={
                <InformationCircleIcon
                  className="h-10 w-10"
                  aria-hidden="true"
                />
              }
              title="Regler og informationer"
              description="Læs turneringsreglerne og informationer"
              link="/turneringer/info"
            />
            <HomeScreenCard
              icon={
                <CheckCircleIcon className="h-10 w-10" aria-hidden="true" />
              }
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
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={
                  <RectangleGroupIcon
                    className="h-10 w-10"
                    aria-hidden="true"
                  />
                }
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
