import { Helmet } from "react-helmet-async";
import HomeBar from "../../components/misc/HomeBar.tsx";
import { useUser } from "../../context/UserContext.tsx";
import { useEffect, useState } from "react";
import Animation from "../../components/misc/Animation.tsx";
import HomeScreenCard from "../../components/HomeScreen/HomeScreenCard.tsx";
import {
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon,
  CogIcon,
  ListBulletIcon,
  MoonIcon,
  NewspaperIcon,
  TicketIcon,
  BuildingOfficeIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { setupNotifications } from "../../utils/notifications";

export const HomePage = () => {
  const { role, refreshUser, username } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Refresh user data if role is not set
    if (!role && !isRefreshing) {
      setIsRefreshing(true);
      refreshUser()
        .then(() => setIsRefreshing(false))
        .catch(() => setIsRefreshing(false));
    }

    // Setup notifications when the homepage loads
    const initializeNotifications = async () => {
      try {
        if (username) {
          await setupNotifications(username);
        } else {
          console.error("Username is null. Notifications setup skipped.");
        }
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
      }
    };

    initializeNotifications();
  }, [role, isRefreshing, refreshUser, username]); // Dependencies ensure it runs on mount and role change

  return (
    <>
      <Helmet>
        <title>Hjem</title>
      </Helmet>

      <Animation>
        <HomeBar />

        <div className="flex mt-10 items-center justify-center">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
              link="/turneringer"
            />
            <HomeScreenCard
              icon={<ListBulletIcon className="h-10 w-10" aria-hidden="true" />}
              title="Rangliste"
              description="Stryg hele vejen til tops i ranglisten"
              link="/rangliste"
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
