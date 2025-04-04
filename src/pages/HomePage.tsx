import { Helmet } from "react-helmet-async";
import HomeBar from "../components/HomeBar";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";
import Animation from "../components/misc/Animation";
import HomeScreenCard from "../components/HomeScreen/HomeScreenCard.tsx";
import {
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  CogIcon,
  HomeIcon,
  ListBulletIcon,
  MoonIcon,
  NewspaperIcon,
  ShieldCheckIcon,
  TicketIcon,
  UserIcon,
  BuildingOfficeIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

export const HomePage = () => {
  const { role, refreshUser } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!role && !isRefreshing) {
      setIsRefreshing(true);
      refreshUser()
        .then(() => setIsRefreshing(false))
        .catch(() => setIsRefreshing(false));
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
              icon={<CalendarIcon className="h-10 w-10" aria-hidden="true" />}
              title="Book Bane"
              description="Reservér en bane til din næste kamp"
              link="/book-court"
            />
            <HomeScreenCard
              icon={
                <AcademicCapIcon className="h-10 w-10" aria-hidden="true" />
              }
              title="Book Træning"
              description="Tilmeld dig træningssessioner"
              link="/book-training"
            />
            <HomeScreenCard
              icon={<UsersIcon className="h-10 w-10" aria-hidden="true" />}
              title="Fællesskab"
              description="Forbind med andre spillere"
              link="/community"
            />
            <HomeScreenCard
              icon={<TrophyIcon className="h-10 w-10" aria-hidden="true" />}
              title="Turneringer"
              description="Deltag i spændende turneringer"
              link="/tournament"
            />
            <HomeScreenCard
              icon={<ListBulletIcon className="h-10 w-10" aria-hidden="true" />}
              title="Rangliste"
              description="Stryg hele vejen til tops i ranglisten"
              link="/rangliste"
            />
            <HomeScreenCard
              icon={
                <CheckCircleIcon className="h-10 w-10" aria-hidden="true" />
              }
              title="Check-in"
              description="Check ind til dine bookinger"
              link="/check-in"
            />
            <HomeScreenCard
              icon={<NewspaperIcon className="h-10 w-10" aria-hidden="true" />}
              title="Nyheder"
              description="Hold dig opdateret med seneste nyt"
              link="/news"
            />
            <HomeScreenCard
              icon={<TicketIcon className="h-10 w-10" aria-hidden="true" />}
              title="Kuponer"
              description="Udløs dine kuponer og tilbud"
              link="/coupon"
            />
            <HomeScreenCard
              icon={<MoonIcon className="h-10 w-10" aria-hidden="true" />}
              title="Lunar Liga"
              description="Deltag i Lunar Liga events"
              link="/lunar-liga"
            />
            <HomeScreenCard
              icon={
                <BuildingOfficeIcon className="h-10 w-10" aria-hidden="true" />
              }
              title="Partnere"
              description="Udforsk vores partnere"
              link="/partner"
            />
            <HomeScreenCard
              icon={<CogIcon className="h-10 w-10" aria-hidden="true" />}
              title="Admin Panel"
              description="Administrer platformen"
              link="/admin"
              disabled={role !== "admin"}
            />
            <HomeScreenCard
              icon={<ChartBarIcon className="h-10 w-10" aria-hidden="true" />}
              title="Arrangementer"
              description="Organisér og se arrangementer"
              link="/arrangement"
            />
          </div>
        </div>
      </Animation>
    </>
  );
};

export default HomePage;
