import { useEffect, useState, useRef, useMemo } from "react"; // Added useRef for click outside logic
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useNavigationHistory } from "../../context/useNavigationHistory";
import BackArrow from "./BackArrow"; // Assuming this component exists and handles navigation back
import {
  Bars3Icon,
  ExclamationCircleIcon,
  HomeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"; // Assuming Heroicons are installed
import { DaoGroupUser } from "../../types/daoGroupAllUsers.ts"; // Assuming this type exists
import userProfileService from "../../services/userProfileService.ts"; // Assuming this service exists
import feedbackService from "../../services/feedbackService.ts"; // Assuming this service exists

type Panel = "search" | "dropdown" | null;

const HomeBar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { getClosestHomePage } = useNavigationHistory();

  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<DaoGroupUser[]>([]);
  const [activePanel, setActivePanel] = useState<Panel>(null);

  // Determine appropriate back page based on current route and navigation history
  const getBackPage = () => {
    // Default fallback route
    let backPage = "/hjem";

    // Handle main sections - they typically go back to home
    if (location.pathname === "/hjem" || location.pathname === "/") {
      // No back button needed on home
      return null;
    }

    // Check for closest home page from navigation history first
    const closestHomePage = getClosestHomePage();
    if (closestHomePage && closestHomePage !== location.pathname) {
      return closestHomePage;
    }

    // Handle specific routes based on URL patterns if no suitable page found in history

    // Tournament related pages
    if (location.pathname.startsWith("/turneringer")) {
      if (location.pathname === "/turneringer") {
        backPage = "/hjem";
      } else {
        backPage = "/turneringer";
      }
    }

    // MatchFinder (Makkerbørs) related pages
    if (location.pathname.startsWith("/makkerbørs")) {
      if (location.pathname === "/makkerbørs") {
        backPage = "/hjem";
      } else if (
        location.pathname.includes("/indtastresultat") ||
        location.pathname.includes("/opretkamp") ||
        location.pathname.includes("/redigerkamp")
      ) {
        backPage = "/makkerbørs";
      } else if (location.pathname.includes("/makkerbørs/")) {
        // Individual match view
        backPage = "/makkerbørs/allekampe";
      }
    }

    // Private events related pages
    if (location.pathname.startsWith("/privat-arrangementer")) {
      if (location.pathname === "/privat-arrangementer") {
        backPage = "/hjem";
      } else if (location.pathname.includes("/opretarrangement")) {
        backPage = "/privat-arrangementer";
      } else if (location.pathname.includes("/privat-arrangementer/")) {
        // Check for individual event view
        const parts = location.pathname.split("/");
        if (parts.length > 2 && parts[2].length > 0) {
          // It's likely viewing a specific event
          backPage = "/privat-arrangementer/minearrangementer";
        }
      }
    }

    // Lunar leagues related pages
    if (location.pathname.startsWith("/holdligaer")) {
      if (location.pathname === "/holdligaer") {
        backPage = "/hjem";
      } else {
        // Check if it's a team profile
        if (location.pathname.includes("/hold/")) {
          // Get the last stored lunar tab from session storage
          const lastLunarTab = sessionStorage.getItem("lastLigaTab");
          backPage = lastLunarTab || "/holdligaer";
        }
      }
    }

    // Profiles
    if (location.pathname.startsWith("/profil")) {
      backPage = "/hjem";
    }

    // Admin
    if (location.pathname.startsWith("/admin")) {
      backPage = "/hjem";
    }

    return backPage;
  };

  // Refs for closing panels on clicks outside
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const searchIconRef = useRef<HTMLButtonElement>(null); // Ref for the search icon
  const menuIconRef = useRef<HTMLButtonElement>(null); // Ref for the menu icon

  // Fetch users for search
  useEffect(() => {
    const fetchUsers = async () => {
      // Clear users and search query when fetching starts or user changes
      setAllUsers([]);
      setSearchQuery("");

      if (!user?.username) {
        setAllUsers([]); // Ensure users are cleared if user logs out
        return;
      }

      try {
        const response = await userProfileService.getAllUsers();
        // Filter out the current user
        const filteredResponse = (response || []).filter(
          (u) => u.username !== user.username
        );
        setAllUsers(filteredResponse);
      } catch (error) {
        console.error("Error fetching users:", error);
        setAllUsers([]); // Clear users on error
      }
    };
    fetchUsers();
  }, [user?.username]); // Re-run when user changes

  // Handle clicks outside the panels
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click was outside the panel AND not on the icon that toggles it
      if (
        activePanel === "search" &&
        searchPanelRef.current &&
        !searchPanelRef.current.contains(event.target as Node) &&
        !searchIconRef.current?.contains(event.target as Node)
      ) {
        setActivePanel(null);
      }
      if (
        activePanel === "dropdown" &&
        dropdownPanelRef.current &&
        !dropdownPanelRef.current.contains(event.target as Node) &&
        !menuIconRef.current?.contains(event.target as Node)
      ) {
        setActivePanel(null);
      }
    };

    // Add event listener when a panel is active
    if (activePanel !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      // Clean up event listener when no panel is active
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup function to remove event listener when component unmounts or activePanel changes
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activePanel]); // Re-run this effect when the activePanel state changes

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return []; // Return empty array if search query is empty
    const lowerSearchQuery = searchQuery.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(lowerSearchQuery) ||
        u.fullName?.toLowerCase().includes(lowerSearchQuery)
    );
  }, [searchQuery, allUsers]); // Re-filter when searchQuery or allUsers changes

  const handleLogout = async () => {
    // Changed to a themed modal/dialog if available, otherwise keep native confirm
    const userConfirmed = window.confirm(
      "Er du sikker på, at du vil logge ud?"
    );

    if (userConfirmed) {
      try {
        await logout();
        navigate("/");
      } catch (error) {
        console.error("Error during logout:", error);
        // Optionally show an error message to the user
        alert("Failed to log out. Please try again.");
      }
    }
  };
  const handleFeedback = async () => {
    if (!user) return;

    const body = prompt("Indtast din feedback her:"); // Keep native prompt for simplicity
    const page = location.pathname;
    if (body !== null && body.trim() !== "") {
      try {
        await feedbackService.createFeedback({
          body,
          page,
          username: user.username,
          date: new Date().toISOString(),
        });
        alert("Tak for din feedback! Vi har modtaget den."); // Themed alert if available, otherwise native
      } catch (error) {
        console.error("Error sending feedback:", error);
        alert("Kunne ikke sende feedback. Prøv igen senere."); // Themed alert or native
      }
    }
  };

  // Toggle panel visibility
  const togglePanel = (panel: Panel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  // Navigate to user profile and close panel
  const handleUserResultClick = (username: string) => {
    navigate(`/profil/${username}`);
    setActivePanel(null); // Close the search panel
  };
  return (
    // Styled header matching LeagueStandingsPage theme
    <header className="bg-gray-800 shadow-xl top-0 sticky z-50">
      {" "}
      {/* Dark background, shadow, sticky, z-index, default text color */}
      <div className="flex h-16 items-center px-4 sm:px-6 justify-between">
        {" "}
        {/* Padding adjustments */}
        {/* Left section: Back Arrow and Feedback Icon */}
        <div className="flex items-center gap-4 sm:gap-6">
          {" "}
          {/* Adjusted gap */}{" "}
          {/* Back Arrow - hide on home page or when we don't have a back page */}
          <div
            className={`${
              location.pathname === "/hjem" || getBackPage() === null
                ? "hidden"
                : ""
            }`}
          >
            <BackArrow
              backPage={
                location.pathname.includes("/rediger")
                  ? -1
                  : getBackPage() || undefined
              }
            />{" "}
            {/* Handle null case */}
          </div>
          {/* Feedback Icon - Only show when user is logged in */}
          {user && (
            <ExclamationCircleIcon
              onClick={handleFeedback}
              className="size-10 sm:size-8 text-red-500 cursor-pointer transition-opacity"
              title="Send Feedback" // Added title for accessibility
            />
          )}
        </div>
        {/* Right section: Always visible with conditional user-specific content */}
        <div className="flex items-center gap-4 sm:gap-6">
          {" "}
          {/* Adjusted gap */}
          {/* Desktop Navigation (hidden on small screens) - Only visible for logged in users */}
          {user && (
            <nav aria-label="Global" className="hidden sm:block">
              <ul className="flex items-center gap-4 sm:gap-6">
                {" "}
                {/* Adjusted gap */}
                <li>
                  <button // Use button for click events
                    onClick={() => navigate(`/profil/${user?.username}`)}
                    className="text-slate-200 text-sm font-medium transition-colors cursor-pointer"
                  >
                    Profil
                  </button>
                </li>
                {user?.role === "admin" && (
                  <li>
                    <button // Use button for click events
                      onClick={() => navigate("/admin")}
                      className="text-slate-200 text-sm font-medium transition-colors cursor-pointer" // Styled link
                    >
                      Admin Panel
                    </button>
                  </li>
                )}
                <li>
                  <button // Use button for click events
                    onClick={handleLogout}
                    className="text-slate-200 text-sm font-medium transition-colors cursor-pointer" // Styled link
                  >
                    Log ud
                  </button>
                </li>
              </ul>
            </nav>
          )}
          {/* Icons Section - Conditionally show based on user state */}
          <div className="flex items-center gap-3 sm:gap-4">
            {" "}
            {/* Adjusted gap */}
            {/* Home Icon - Always visible except on home page */}
            {location.pathname !== "/hjem" && (
              <HomeIcon
                onClick={() => navigate("/hjem")}
                className="size-7 sm:size-8 cursor-pointer transition-color text-slate-400"
                title="Hjem" // Added title
              />
            )}
            {/* User-specific icons - Only show for logged in users */}
            {user && (
              <>
                {/* Search Icon */}
                <button
                  ref={searchIconRef}
                  onClick={() => togglePanel("search")}
                  className="rounded"
                >
                  {" "}
                  {/* Wrap in button for focus state */}
                  <MagnifyingGlassIcon
                    className={
                      `size-7 sm:size-8 cursor-pointer transition-colors
                                        ${
                                          activePanel === "search"
                                            ? "text-brand-primary"
                                            : "text-slate-400"
                                        }` // Active/inactive color
                    }
                    title="Søg Bruger" // Added title
                  />
                </button>
                {/* Mobile Menu Icon (hidden on large screens) */}
                <button
                  ref={menuIconRef}
                  onClick={() => togglePanel("dropdown")}
                  className="sm:hidden rounded"
                >
                  {" "}
                  {/* Wrap in button, keep sm:hidden */}
                  <Bars3Icon
                    className={
                      `size-7 sm:size-8 cursor-pointer transition-colors
                                        ${
                                          activePanel === "dropdown"
                                            ? "text-brand-primary"
                                            : "text-slate-400"
                                        }` // Active/inactive color
                    }
                    title="Menu" // Added title
                  />
                </button>
              </>
            )}
          </div>
        </div>
      </div>{" "}
      {/* Only show panels when a user is logged in */}
      {user && (
        <>
          {/* Search Panel (Positioned below the header, full width on small screens) */}
          {activePanel === "search" && (
            <div
              ref={searchPanelRef}
              className="absolute left-0 right-0 z-10 bg-slate-800 shadow-xl border border-slate-700 animate-fadeInDown"
            >
              {" "}
              {/* Dark style, full width horizontal, border */}
              <div className="p-2 sm:p-3">
                {" "}
                {/* Add padding inside the panel */}
                <input
                  type="text"
                  className="w-full h-10 px-3 py-2 text-sm bg-slate-750 text-slate-200 border border-slate-600 rounded-md placeholder-slate-500 transition-all duration-150" // Styled input
                  placeholder="Søg efter bruger..." // Updated placeholder text
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  // No need for onBlur here as we have click outside logic
                />
                {searchQuery && (
                  <div className="mt-2 bg-slate-700 border border-slate-600 rounded-md overflow-y-auto max-h-40 custom-scrollbar">
                    {" "}
                    {/* Styled results container */}
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserResultClick(user.username)}
                          className="px-3 py-2 cursor-pointer text-slate-200 text-sm transition-colors truncate" // Styled result item
                        >
                          <h1>
                            {user.fullName
                              ? `${user.fullName} (${user.username})`
                              : user.username}
                          </h1>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-slate-500 text-sm italic">
                        {" "}
                        {/* Styled no results message */}
                        Ingen brugere fundet
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Dropdown Menu (Positioned below the header, right aligned, hidden on small screens) */}
          {activePanel === "dropdown" && (
            <div
              ref={dropdownPanelRef}
              className="absolute right-0 mt-0 w-48 rounded-md bg-slate-800 shadow-lg ring-1 ring-slate-700 animate-fadeInDown sm:hidden"
            >
              {" "}
              {/* Dark style, width, border, shadow, hidden on sm+ */}
              <div className="py-1" role="none">
                {/* Profil is always present */}
                <button
                  onClick={() => {
                    navigate(`/profil/${user?.username}`);
                    setActivePanel(null);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-200 transition-colors"
                  role="menuitem"
                >
                  Profil
                </button>
                {/* Only show extra links if user has preRelease or admin role */}
                {user.role === "preRelease" || user.role === "admin" ? (
                  <>
                    <button
                      onClick={() => {
                        navigate(`/makkerbørs`);
                        setActivePanel(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-200 transition-colors"
                      role="menuitem"
                    >
                      Makkerbørs
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/privat-arrangementer`);
                        setActivePanel(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-200 transition-colors"
                      role="menuitem"
                    >
                      Privat-arrangementer
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/holdligaer`);
                        setActivePanel(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-200 transition-colors"
                      role="menuitem"
                    >
                      Holdligaer
                    </button>
                  </>
                ) : (
                  <>
                    {/* DPF univers homecards for non-preRelease/non-admin users, sorted alphabetically */}
                    {(
                      [
                        {
                          label: "Baneoversigt",
                          path: "/turneringer/baneoversigt",
                        },
                        { label: "Check-in", path: "/turneringer/check-in" },
                        {
                          label: "Indtast resultat",
                          path: "/turneringer/enter-resultat",
                        },
                        { label: "Info", path: "/turneringer/info" },
                        {
                          label: "Kommende turneringer",
                          path: "/turneringer/kommende",
                        },
                        {
                          label: "Lodtrækninger",
                          path: "/turneringer/lodtrækninger",
                        },
                        { label: "Turneringer", path: "/turneringer" },
                      ] as { label: string; path: string }[]
                    )
                      .sort((a, b) => a.label.localeCompare(b.label, "da"))
                      .map((item: { label: string; path: string }) => (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setActivePanel(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-slate-200 transition-colors"
                          role="menuitem"
                        >
                          {item.label}
                        </button>
                      ))}
                  </>
                )}
                {/* Admin Panel only for admin */}
                {user.role === "admin" && (
                  <button
                    onClick={() => {
                      navigate("/admin");
                      setActivePanel(null);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-200 transition-colors"
                    role="menuitem"
                  >
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-200 transition-colors"
                  role="menuitem"
                >
                  Log ud
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </header>
  );
};

export default HomeBar;
