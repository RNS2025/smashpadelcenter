import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext.tsx";
import HomeBar from "../../components/misc/HomeBar.tsx";
import Animation from "../../components/misc/Animation.tsx";
import HomeScreenCard from "../../components/HomeScreen/HomeScreenCard.tsx";
import LoadingSpinner from "../../components/misc/LoadingSpinner.tsx";
import { setupNotifications } from "../../utils/notifications";
import {
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon,
  CogIcon,
  ListBulletIcon,
  MoonIcon, // Consider replacing with a more thematic icon if possible
  NewspaperIcon,
  TicketIcon,
  BuildingOfficeIcon,
  TrophyIcon,
  UsersIcon,
  CubeIcon,
  PresentationChartBarIcon,
  RectangleGroupIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

// --- Define Card Data ---
// Makes adding/removing/modifying cards much easier
const homeScreenItems = [
  {
    title: "Book Bane",
    description: "Reservér en bane til din næste kamp",
    link: "book-court",
    icon: <CalendarIcon className="size-10" aria-hidden="true" />,
    adminOnly: true,
  },
  {
    title: "Book Træning",
    description: "Tilmeld dig træningssessioner",
    link: "book-training",
    icon: <AcademicCapIcon className="size-10" aria-hidden="true" />,
    adminOnly: true,
  },
  {
    title: "Arrangementer",
    description: "Organisér og se arrangementer",
    link: "arrangement",
    icon: <ChartBarIcon className="size-10" aria-hidden="true" />,
    adminOnly: true,
  },
  {
    title: "Makkerbørs",
    description: "Søg med- og modspillere",
    link: "/makkerbørs",
    icon: <UsersIcon className="size-10" aria-hidden="true" />,
    adminOnly: false,
  },
  {
    title: "Privat-arrangementer",
    description: "Opret og administrer dine egne arrangementer",
    link: "/privat-arrangementer",
    icon: <CubeIcon className="size-10" aria-hidden="true" />,
    adminOnly: false,
  },
  {
    title: "Holdligaer",
    description: "Overblik over ligaholdene tilknyttet SMASH",
    link: "/holdligaer",
    icon: <MoonIcon className="size-10" aria-hidden="true" />, // Consider a more thematic icon if needed
    adminOnly: false,
  },
  {
    title: "DPF-universet",
    description: "Deltag i spændende turneringer",
    link: "/turneringer",
    icon: <TrophyIcon className="size-10" aria-hidden="true" />,
    adminOnly: false,
  },
  {
    title: "Rangliste",
    description: "Stryg hele vejen til tops i ranglisten",
    link: "rangliste",
    icon: <ListBulletIcon className="size-10" aria-hidden="true" />,
    adminOnly: true, // Assuming this is admin or specific role only
  },
  {
    title: "Nyheder",
    description: "Hold dig opdateret med seneste nyt",
    link: "news",
    icon: <NewspaperIcon className="size-10" aria-hidden="true" />,
    adminOnly: true, // Or make public? Adjust as needed
  },
  {
    title: "Kuponer",
    description: "Udløs dine kuponer og tilbud",
    link: "coupon",
    icon: <TicketIcon className="size-10" aria-hidden="true" />,
    adminOnly: true,
  },
  {
    title: "Partnere",
    description: "Udforsk vores partnere",
    link: "partner",
    icon: <BuildingOfficeIcon className="size-10" aria-hidden="true" />,
    adminOnly: true,
  },
  {
    title: "Feedback",
    description: "Se og administrer feedback",
    link: "/feedback",
    icon: <PresentationChartBarIcon className="size-10" aria-hidden="true" />,
    adminOnly: true,
  },
  {
    title: "Følg med i Lunar Ligaen",
    description: "Se resultater fra Lunar ligaen",
    link: "/lunarGlobal",
    icon: <RectangleGroupIcon className="size-10" aria-hidden="true" />, // Maybe a more sports-related icon?
    adminOnly: true,
  },
  {
    title: "Admin Panel",
    description: "Administrer platformen",
    link: "admin",
    icon: <CogIcon className="size-10" aria-hidden="true" />,
    adminOnly: true,
  },
  // Example: Add a Profile/Settings Card
  // {
  //   title: "Min Profil",
  //   description: "Administrer dine oplysninger",
  //   link: "/profile", // Adjust link
  //   icon: <UserCircleIcon className="size-10" aria-hidden="true" />,
  //   adminOnly: false,
  // },
];

export const HomePage = () => {
  const { user, loading } = useUser();
  const [isNotificationsInitialized, setNotificationsInitialized] =
    useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isNotificationsInitialized || !user?.username) return;

    const initializeNotifications = async () => {
      try {
        console.log(
          "Attempting to initialize notifications for:",
          user.username
        );
        await setupNotifications(user.username);
        setNotificationsInitialized(true);
        console.log("Notifications initialized successfully.");
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
        // Optional: Provide user feedback about notification failure
      }
    };

    initializeNotifications();
  }, [user?.username, isNotificationsInitialized]);

  // --- Loading State ---
  if (loading) {
    return (
      <>
        <HomeBar />
        {/* Apply futuristic background even to loading screen for consistency */}
        {/* Ensuring min-h-screen for loading as well */}
        <div className="w-full min-h-[calc(100vh-100px)] flex justify-center items-center bg-gradient-to-br from-gray-900 to-black text-gray-100">
          {/* Adjusted gradient slightly darker/more dramatic */}
          {/* Adjust height calc if HomeBar height changes */}
          <LoadingSpinner />
        </div>
      </>
    );
  }

  // --- Filter cards based on user role ---
  const visibleItems = homeScreenItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  // --- Render Page ---
  return (
    <>
      <Helmet>
        <title>Hjem - SMASH Dashboard</title>
        <meta
          name="description"
          content="Your central hub for SMASH activities."
        />
      </Helmet>

      {/* Apply futuristic background and text color to the main container */}
      {/* Adjusted gradient slightly darker/more dramatic */}
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100">
        <HomeBar />

        {/* Increased vertical padding for more breathing room */}
        <main className="px-4 sm:px-6 lg:px-8 py-16">
          {/* Welcome Message - already has futuristic gradient */}
          {user?.username && (
            <h1 className="text-3xl md:text-4xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-lg">
              {/* Added drop-shadow for extra pop */}
              Velkommen, {user.fullName || user.username}!{" "}
            </h1>
          )}

          <Animation>
            {/* Wraps the grid for entry animation */}
            <div className="flex items-center justify-center">
              {/* Responsive Grid Layout with increased spacing */}
              {/* Adjusted gap for more separation */}
              <div className="grid gap-12 lg:gap-20 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4 mb-4">
                {visibleItems.map((item) => (
                  <HomeScreenCard
                    key={item.link}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    link={item.link}
                    disabled={item.adminOnly && user?.role !== "admin"} // Disable if adminOnly and not admin
                  />
                ))}
              </div>
            </div>
          </Animation>
        </main>

        {/* Optional Footer could go here */}
        {/* <footer className="text-center p-4 text-gray-500 text-sm">
           © {new Date().getFullYear()} SMASH Platform. All rights reserved.
         </footer> */}
      </div>
    </>
  );
};

export default HomePage;
