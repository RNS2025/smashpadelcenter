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
  PresentationChartBarIcon,
} from "@heroicons/react/24/outline";
import { setupNotifications } from "../../utils/notifications";
import LoadingSpinner from "../../components/misc/LoadingSpinner.tsx";

export const HomePage = () => {
  const { user, loading } = useUser();
  const [isNotificationsInitialized, setNotificationsInitialized] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isNotificationsInitialized || !user?.username) return;

    const initializeNotifications = async () => {
      try {
        await setupNotifications(user.username);
        setNotificationsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
      }
    };

    initializeNotifications().then();
  }, [user?.username, isNotificationsInitialized]);

  if (loading) {
    return (
        <>
          <HomeBar />
          <div className="w-full h-[calc(100vh-150px)] flex justify-center items-center">
            <LoadingSpinner />
          </div>
        </>
    )
  }

  return (
    <>
      <Helmet>
        <title>Hjem</title>
      </Helmet>

      <HomeBar />
      <Animation>
        <div className="flex my-5 items-center justify-center">
          <div className="grid gap-8 lg:gap-20 grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-2">
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={<CalendarIcon className="size-10" aria-hidden="true" />}
                title="Book Bane"
                description="Reservér en bane til din næste kamp"
                link="book-court"
              />
            )}
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={
                  <AcademicCapIcon className="size-10" aria-hidden="true" />
                }
                title="Book Træning"
                description="Tilmeld dig træningssessioner"
                link="book-training"
              />
            )}
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={<ChartBarIcon className="size-10" aria-hidden="true" />}
                title="Arrangementer"
                description="Organisér og se arrangementer"
                link="arrangement"
              />
            )}
            <HomeScreenCard
              icon={<UsersIcon className="size-10" aria-hidden="true" />}
              title="Makkerbørs"
              description="Søg med- og modspillere"
              link="/makkerbørs"
            />

            <HomeScreenCard
              icon={<CubeIcon className="size-10" aria-hidden="true" />}
              title="Privat-arrangementer"
              description="Opret og administrer dine egne arrangementer"
              link="/privat-arrangementer"
            />

            <HomeScreenCard
              icon={<MoonIcon className="size-10" aria-hidden="true" />}
              title="Holdligaer"
              description="Overblik over ligaholdene tilknyttet SMASH"
              link="/holdligaer"
            />

            <HomeScreenCard
              icon={<TrophyIcon className="size-10" aria-hidden="true" />}
              title="DPF-turneringer"
              description="Deltag i spændende turneringer"
              link="/turneringer"
            />
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={<ListBulletIcon className="size-10" aria-hidden="true" />}
                title="Rangliste"
                description="Stryg hele vejen til tops i ranglisten"
                link="rangliste"
              />
            )}
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={<NewspaperIcon className="size-10" aria-hidden="true" />}
                title="Nyheder"
                description="Hold dig opdateret med seneste nyt"
                link="news"
              />
            )}
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={<TicketIcon className="size-10" aria-hidden="true" />}
                title="Kuponer"
                description="Udløs dine kuponer og tilbud"
                link="coupon"
              />
            )}
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={
                  <BuildingOfficeIcon className="size-10" aria-hidden="true" />
                }
                title="Partnere"
                description="Udforsk vores partnere"
                link="partner"
              />
            )}
            {user?.role === "admin" && (
              <HomeScreenCard
                icon={<CogIcon className="size-10" aria-hidden="true" />}
                title="Admin Panel"
                description="Administrer platformen"
                link="admin"
              />
            )}

            {user?.username === "admin" && (
              <HomeScreenCard
                icon={
                  <PresentationChartBarIcon
                    className="size-10"
                    aria-hidden="true"
                  />
                }
                title="Feedback"
                description="Se og administrer feedback"
                link="/feedback"
              />
            )}
          </div>
        </div>
      </Animation>
    </>
  );
};

export default HomePage;
