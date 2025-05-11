import {useEffect, useState} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import NotificationSelector from "../NotificationSelector";
import BackArrow from "./BackArrow";
import {Bars3Icon, BellIcon, ExclamationCircleIcon, HomeIcon, MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {DaoGroupUser} from "../../types/daoGroupAllUsers.ts";
import userProfileService from "../../services/userProfileService.ts";
import feedbackService from "../../services/feedbackService.ts";

const HomeBar = ({ backPage }: { backPage?: string }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<DaoGroupUser[]>([]);
  type Panel = "search" | "notifications" | "dropdown" | null;
  const [activePanel, setActivePanel] = useState<Panel>(null);


  useEffect(() => {
    const fetchUsers = async () => {

      setAllUsers([]);
      setSearchQuery("");

      if (!user?.username) return;
      
        try {
          const response = await userProfileService.getAllUsers();
          const filteredResponse = (response || []).filter(
              (u) => u.username !== user.username
          );
          setAllUsers(filteredResponse);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
    };
    fetchUsers().then();
  }, [user?.username]);

  const filteredUsers =
      allUsers?.filter(
          (u) =>
              (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())));

  const handleLogout = async () => {
    const userConfirmed = confirm("Er du sikker på, at du vil logge ud?");

    if (userConfirmed) {
      await logout();
      navigate("/");
    }
  };

    const handleFeedback = async () => {
      if (!user) return;

      const body = prompt("Rapporter feedback");
      const page = location.pathname;
      if (body !== null && body.trim() !== "") {
        try {
          await feedbackService.createFeedback({ body, page, username: user.username, date: new Date().toISOString() });
          alert("Tak for din feedback!");
        } catch (error) {
            console.error("Error sending feedback:", error);
        }
      }
    };

  return (
    <header className="bg-gradient-to-b from-white to-gray-300 shadow-lg top-0 sticky z-50">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex items-center gap-6">
          <div className={`${location.pathname === "/hjem" ? "hidden" : ""}`}>
            <BackArrow backPage={backPage} />
          </div>
          <ExclamationCircleIcon onClick={handleFeedback} className="size-10 text-red-500" />
        </div>

        {user && (
        <div className="flex items-center gap-8">
          <nav aria-label="Global" className="hidden sm:block">
            <ul className="flex items-center gap-6">
              <li>
                <h1
                  onClick={() => navigate(`/profil/${user?.username}`)}
                  className="text-black cursor-pointer"
                >
                  {" "}
                  Profil{" "}
                </h1>
              </li>

              {user?.role === "admin" && (
                <li>
                  <h1
                    onClick={() => navigate("/admin")}
                    className="text-black cursor-pointer"
                  >
                    {" "}
                    Admin Panel{" "}
                  </h1>
                </li>
              )}

              <li>
                <h1
                  onClick={handleLogout}
                  className="text-black cursor-pointer"
                >
                  {" "}
                  Log ud{" "}
                </h1>
              </li>
            </ul>
          </nav>

          <div className="flex items-center">
            <div className="flex gap-4 items-center">
              <HomeIcon
                onClick={() => navigate("/hjem")}
                className={`size-8 text-black cursor-pointer ${
                  location.pathname === "/hjem" ? "hidden" : ""
                }`}
              />
              <MagnifyingGlassIcon
                  onClick={() =>
                      setActivePanel((prev) => (prev === "search" ? null : "search"))
                  }
                  className={`size-8 cursor-pointer ${
                      activePanel === "search" ? "text-cyan-500" : "text-black"
                  }`}
              />

              <BellIcon
                  onClick={() =>
                      setActivePanel((prev) => (prev === "notifications" ? null : "notifications"))
                  }
                  className={`size-8 cursor-pointer ${
                      activePanel === "notifications" ? "text-cyan-500" : "text-black"
                  }`}
              />

              <Bars3Icon
                  onClick={() =>
                      setActivePanel((prev) => (prev === "dropdown" ? null : "dropdown"))
                  }
                  className={`size-8 cursor-pointer ${
                      activePanel === "dropdown" ? "text-cyan-500" : "text-black"
                  } sm:hidden`}
              />

            </div>
          </div>
        </div>
          )}
      </div>

      {activePanel === "notifications" && user && (
        <div className="absolute right-0 w-96 z-50 max-sm:w-full">
          <NotificationSelector userId={user.username} />
        </div>
      )}

      {activePanel === "search" && (
          <div className="absolute right-0 z-10 w-full bg-white shadow-lg focus:outline-none border border-white">
            <input
                type="text"
                className="w-full size-12 resize-none text-black border border-gray-500"
                placeholder="Søg efter spiller..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
                <div className="absolute z-10 bg-white w-full border border-black rounded pb-2 h-40 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                          <div
                              key={user.id}
                              onClick={() => {
                                navigate(`/profil/${user.username}`)
                                setActivePanel(null);
                              }}
                              className="px-4 py-2 cursor-pointer text-black"
                          >
                            <h1 className="truncate">
                              {user.fullName ? `${user.fullName} (${user.username})` : user.username}
                            </h1>
                          </div>
                      ))
                  ) : (
                      <div className="px-4 py-2 text-gray-400">
                        Ingen brugere fundet
                      </div>
                  )}
                </div>
            )}
          </div>
      )}

      {activePanel === "dropdown" && user && (
        <div className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1" role="none">
            <h1
              onClick={() => navigate(`/profil/${user?.username}`)}
              className="block px-4 py-2 text-sm text-black"
            >
              Profil
            </h1>
            <h1
              onClick={() => navigate("/admin")}
              className={`block px-4 py-2 text-sm text-black ${
                user?.role === "admin" ? "" : "hidden"
              }`}
            >
              Admin Panel
            </h1>
            <h1
              onClick={handleLogout}
              className="block px-4 py-2 text-sm text-black"
            >
              Log ud
            </h1>
          </div>
        </div>
      )}
    </header>
  );
};

export default HomeBar;
