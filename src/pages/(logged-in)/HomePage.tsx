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
  CubeIcon,
} from "@heroicons/react/24/outline";
import { setupNotifications } from "../../utils/notifications";

export const HomePage = () => {
  const { refreshUser, user, isAuthenticated } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    // Only refresh user data if not authenticated or role is missing
    if (!isAuthenticated || !user?.role) {
      if (!isRefreshing) {
        setIsRefreshing(true);
        // Delay refresh to allow session to stabilize after OAuth redirect
        timeoutId = setTimeout(() => {
          refreshUser()
            .then(() => setIsRefreshing(false))
            .catch((err) => {
              console.error("Failed to refresh user:", err);
              setIsRefreshing(false);
            });
        }, 1000); // 1-second delay
      }
    }

    // Initialize notifications only if username exists
    if (!user?.username) return;

    const initializeNotifications = async () => {
      try {
        await setupNotifications(user?.username);
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
      }
    };

    initializeNotifications().then();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, isRefreshing, refreshUser, isAuthenticated]);

  return (
    <>
      <Helmet>
        <title>Hjem</title>
      </Helmet>

      <HomeBar />
      <Animation>
        <div className="flex my-5 items-center justify-center">
          <div className="grid gap-8 lg:gap-20 grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-1">
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={<CalendarIcon className="h-10 w-10" aria-hidden="true" />}
                title="Book Bane"
                description="Reservér en bane til din næste kamp"
                link="book-court"
              />
            )}
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={
                  <AcademicCapIcon className="h-10 w-10" aria-hidden="true" />
                }
                title="Book Træning"
                description="Tilmeld dig træningssessioner"
                link="book-training"
              />
            )}
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={<ChartBarIcon className="h-10 w-10" aria-hidden="true" />}
                title="Arrangementer"
                description="Organisér og se arrangementer"
                link="arrangement"
              />
            )}
            <HomeScreenCard
              icon={<UsersIcon className="h-10 w-10" aria-hidden="true" />}
              title="Makkerbørs"
              description="Søg med- og modspillere"
              link="/makkerbørs"
            />

            <HomeScreenCard
              icon={<CubeIcon className="h-10 w-10" aria-hidden="true" />}
              title="Privat-arrangementer"
              description="Opret og administrer dine egne arrangementer"
              link="/privat-arrangementer"
            />

            <HomeScreenCard
              icon={<MoonIcon className="h-10 w-10" aria-hidden="true" />}
              title="Holdligaer"
              description="Overblik over ligaholdene tilknyttet SMASH"
              link="/holdligaer"
            />

            <HomeScreenCard
              icon={<TrophyIcon className="h-10 w-10" aria-hidden="true" />}
              title="DPF-turneringer"
              description="Deltag i spændende turneringer"
              link="turneringer"
            />
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={
                  <ListBulletIcon className="h-10 w-10" aria-hidden="true" />
                }
                title="Rangliste"
                description="Stryg hele vejen til tops i ranglisten"
                link="rangliste"
              />
            )}
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={
                  <NewspaperIcon className="h-10 w-10" aria-hidden="true" />
                }
                title="Nyheder"
                description="Hold dig opdateret med seneste nyt"
                link="news"
              />
            )}
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={<TicketIcon className="h-10 w-10" aria-hidden="true" />}
                title="Kuponer"
                description="Udløs dine kuponer og tilbud"
                link="coupon"
              />
            )}
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={
                  <BuildingOfficeIcon
                    className="h-10 w-10"
                    aria-hidden="true"
                  />
                }
                title="Partnere"
                description="Udforsk vores partnere"
                link="partner"
              />
            )}
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={<CogIcon className="h-10 w-10" aria-hidden="true" />}
                title="Admin Panel"
                description="Administrer platformen"
                link="admin"
              />
            )}
          </div>
        </div>
      </Animation>
    </>
  );
};

export default HomePage;
