import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import NotificationSelector from "../NotificationSelector";
import BackArrow from "./BackArrow";
import { Bars3Icon, BellIcon, HomeIcon } from "@heroicons/react/24/outline";
import smashLogoSort from "../../assets/smash logo sort.png";

const HomeBar = ({ backPage }: { backPage?: string }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleLogout = async () => {
    const userConfirmed = confirm("Er du sikker på, at du vil logge ud?");

    if (userConfirmed) {
      await logout();
      navigate("/");
    }
  };

  return (
    <header className="bg-white top-0 sticky z-50">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <div className={`${location.pathname === "/hjem" ? "hidden" : ""}`}>
            <BackArrow backPage={backPage} />
          </div>
          <img
            src={smashLogoSort}
            alt="Smash Logo"
            className="h-14 cursor-pointer"
            onClick={() => user ? navigate("/hjem") : navigate("/")}
          />
        </div>

        {user && (
        <div className="flex items-center gap-8">
          <nav aria-label="Global" className="hidden sm:block">
            <ul className="flex items-center gap-6">
              <li>
                <h1
                  onClick={() => navigate("/profil")}
                  className="text-black transition hover:text-gray-500/75 cursor-pointer"
                >
                  {" "}
                  Profil{" "}
                </h1>
              </li>

              {user?.role === "admin" && (
                <li>
                  <h1
                    onClick={() => navigate("/admin")}
                    className="text-black transition hover:text-gray-500/75 cursor-pointer"
                  >
                    {" "}
                    Admin Panel{" "}
                  </h1>
                </li>
              )}

              <li>
                <h1
                  onClick={handleLogout}
                  className="text-black transition hover:text-gray-500/75 cursor-pointer"
                >
                  {" "}
                  Log ud{" "}
                </h1>
              </li>
            </ul>
          </nav>

          <div className="flex items-center">
            <div className="flex gap-4">
              <HomeIcon
                onClick={() => navigate("/hjem")}
                className={`h-8 text-black cursor-pointer ${
                  location.pathname === "/hjem" ? "hidden" : ""
                }`}
              />
              <BellIcon
                onClick={() => setNotificationsVisible((prev) => !prev)}
                className={`h-8 cursor-pointer ${
                  notificationsVisible ? "text-cyan-500" : "text-black"
                }`}
              />
              <Bars3Icon
                onClick={() => setDropdownVisible((prev) => !prev)}
                className={`sm:hidden h-8 cursor-pointer ${
                  dropdownVisible ? "text-cyan-500" : "text-black"
                }`}
              />
            </div>
          </div>
        </div>
          )}
      </div>

      {notificationsVisible && user && (
        <div className="absolute right-0 w-96 z-50 max-sm:w-full">
          <NotificationSelector userId={user.username} />
        </div>
      )}

      {dropdownVisible && user && (
        <div className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1" role="none">
            <h1
              onClick={() => navigate("/profil")}
              className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
            >
              Profil
            </h1>
            <h1
              onClick={() => navigate("/admin")}
              className={`block px-4 py-2 text-sm text-black hover:bg-gray-100 ${
                user?.role === "admin" ? "" : "hidden"
              }`}
            >
              Admin Panel
            </h1>
            <h1
              onClick={handleLogout}
              className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
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
