import { Helmet } from "react-helmet-async";
import HomeScreenCard from "../../components/HomeScreen/HomeScreenCard.tsx";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  MapIcon,
  QueueListIcon,
  RectangleGroupIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import Animation from "../../components/misc/Animation.tsx";
import { useUser } from "../../context/UserContext.tsx";
import { useEffect } from "react";

export const TournamentTabs = () => {
  const { user } = useUser();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Turneringer</title>
      </Helmet>

      <Animation>
        <div className="flex my-5 items-center justify-center">
          <div
            className={`grid grid-cols-2 gap-8 sm:grid-cols-3 ${
              user?.role === "admin" ? "lg:grid-cols-4" : "lg:grid-cols-3"
            }`}
          >
            <HomeScreenCard
              icon={
                <InformationCircleIcon className="size-10" aria-hidden="true" />
              }
              title="Regler og informationer"
              description="Læs turneringsreglerne og informationer"
              link="/turneringer/info"
            />
            <HomeScreenCard
              icon={<CheckCircleIcon className="size-10" aria-hidden="true" />}
              title="Indtjekning"
              description="Tjek ind til DPF-turneringer"
              link="/turneringer/check-in"
            />
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={<QueueListIcon className="size-10" aria-hidden="true" />}
                title="Lodtrækninger"
                description="Se lodtrækninger for kommende turnering"
                link="/turneringer/lodtrækninger"
              />
            )}
            <HomeScreenCard
              icon={<MapIcon className="size-10" aria-hidden="true" />}
              title="Baneoversigt"
              description="Se hvor kampene bliver afviklet"
              link="/turneringer/baneoversigt"
            />
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={
                  <RectangleGroupIcon className="size-10" aria-hidden="true" />
                }
                title="Resultater"
                description="Indtast resultater for DPF-kampe"
                link="/turneringer/resultater"
              />
            )}
            <HomeScreenCard
              icon={
                <RectangleGroupIcon className="size-10" aria-hidden="true" />
              }
              title="DPF Turneringer"
              description="Se kommende DPF turneringer"
              link="/turneringer/kommende"
            />
            <HomeScreenCard
              icon={
                <RectangleGroupIcon className="size-10" aria-hidden="true" />
              }
              title="Indtast Resultat"
              description="Indtast resultater for dine kampe"
              link="/turneringer/enter-resultat"
            />
            {user?.rankedInId && (
              <HomeScreenCard
                icon={<UserCircleIcon className="size-10" aria-hidden="true" />}
                title="Spillerprofil"
                description="Se din spillerstatistik og kamphistorik"
                link={`/turneringer/spiller/${user.rankedInId}`}
              />
            )}
          </div>
        </div>
      </Animation>
    </>
  );
};

export default TournamentTabs;
