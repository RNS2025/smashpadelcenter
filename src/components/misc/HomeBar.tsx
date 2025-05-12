import { useEffect, useState, useRef, useMemo } from "react"; // Added useRef for click outside logic
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import NotificationSelector from "../NotificationSelector"; // Assuming this component exists and is styled internally or will be styled separately
import BackArrow from "./BackArrow"; // Assuming this component exists and handles navigation back
import {
  Bars3Icon,
  BellIcon,
  ExclamationCircleIcon,
  HomeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"; // Assuming Heroicons are installed
import { DaoGroupUser } from "../../types/daoGroupAllUsers.ts"; // Assuming this type exists
import userProfileService from "../../services/userProfileService.ts"; // Assuming this service exists
import feedbackService from "../../services/feedbackService.ts"; // Assuming this service exists

type Panel = "search" | "notifications" | "dropdown" | null;

const HomeBar = ({ backPage }: { backPage?: string }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<DaoGroupUser[]>([]);
  const [activePanel, setActivePanel] = useState<Panel>(null);

  // Refs for closing panels on clicks outside
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const notificationsPanelRef = useRef<HTMLDivElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const searchIconRef = useRef<HTMLButtonElement>(null); // Ref for the search icon
  const bellIconRef = useRef<HTMLButtonElement>(null); // Ref for the bell icon
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
        activePanel === "notifications" &&
        notificationsPanelRef.current &&
        !notificationsPanelRef.current.contains(event.target as Node) &&
        !bellIconRef.current?.contains(event.target as Node)
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
          {/* Adjusted gap */}
          {/* Back Arrow - assuming it's styled internally or inherits text color */}
          <div className={`${location.pathname === "/hjem" ? "hidden" : ""}`}>
            <BackArrow backPage={backPage} /> {/* Added style classes */}
          </div>
          {/* Feedback Icon */}
          <ExclamationCircleIcon
            onClick={handleFeedback}
            className="size-10 sm:size-8 text-red-500 cursor-pointer transition-opacity"
            title="Send Feedback" // Added title for accessibility
          />
        </div>
        {/* Right section: User-specific content */}
        {user && (
          <div className="flex items-center gap-4 sm:gap-6">
            {" "}
            {/* Adjusted gap */}
            {/* Desktop Navigation (hidden on small screens) */}
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
            {/* Icons Section */}
            <div className="flex items-center gap-3 sm:gap-4">
              {" "}
              {/* Adjusted gap */}
              {/* Home Icon */}
              <HomeIcon
                onClick={() => navigate("/hjem")}
                className={
                  `size-7 sm:size-8 cursor-pointer transition-color
                                    ${
                                      location.pathname === "/hjem"
                                        ? "hidden"
                                        : "text-slate-400"
                                    }` // Hide on home, set default color
                }
                title="Hjem" // Added title
              />
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
              {/* Notifications Icon */}
              <button
                ref={bellIconRef}
                onClick={() => togglePanel("notifications")}
                className="rounded"
              >
                {" "}
                {/* Wrap in button for focus state */}
                <BellIcon
                  className={
                    `size-7 sm:size-8 cursor-pointer transition-colors
                                        ${
                                          activePanel === "notifications"
                                            ? "text-brand-primary"
                                            : "text-slate-400"
                                        }` // Active/inactive color
                  }
                  title="Notifikationer" // Added title
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
            </div>
          </div>
        )}
      </div>
      {/* Notifications Panel (Positioned below the header) */}
      {activePanel === "notifications" && user && (
        <div
          ref={notificationsPanelRef}
          className="absolute right-0 mt-0 w-full sm:w-96 z-50 bg-slate-800 shadow-xl rounded-md border border-slate-700 overflow-hidden"
        >
          {" "}
          {/* Dark style, width, border, overflow */}
          {/* Assuming NotificationSelector is styled internally */}
          <NotificationSelector userId={user.username} />
        </div>
      )}
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
      {activePanel === "dropdown" && user && (
        <div
          ref={dropdownPanelRef}
          className="absolute right-0 mt-0 w-48 rounded-md bg-slate-800 shadow-lg ring-1 ring-slate-700 animate-fadeInDown sm:hidden"
        >
          {" "}
          {/* Dark style, width, border, shadow, hidden on sm+ */}
          <div className="py-1" role="none">
            <button // Use button for click events and styling
              onClick={() => {
                navigate(`/profil/${user?.username}`);
                setActivePanel(null);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-slate-200 transition-colors" // Styled item
              role="menuitem" // ARIA role
            >
              Profil
            </button>
            {user?.role === "admin" && (
              <button // Use button
                onClick={() => {
                  navigate("/admin");
                  setActivePanel(null);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-slate-200 transition-colors" // Styled item
                role="menuitem" // ARIA role
              >
                Admin Panel
              </button>
            )}
            <button // Use button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-slate-200 transition-colors" // Styled item
              role="menuitem" // ARIA role
            >
              Log ud
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default HomeBar;
