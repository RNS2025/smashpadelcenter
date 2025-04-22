import {NavLink, useLocation} from "react-router-dom";

export const ProfileTabMenu = () => {
    const location = useLocation();

    return (
        <div>
            <nav className="flex gap-6" aria-label="Tabs">
                <NavLink
                    to={`/profil/overblik`}
                    className={`font-semibold inline-flex items-center justify-center h-8 shrink-0 rounded-full gap-2 px-2 text-sm max-sm:text-xs
                      ${location.pathname.includes("overblik")
                        ? "bg-cyan-100 text-cyan-600"
                        : "text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"}`}
                >
                    Overblik
                </NavLink>

                <NavLink
                    to={`/profil/rediger`}
                    className={`font-semibold inline-flex items-center justify-center h-8 shrink-0 rounded-full gap-2 px-2 text-sm max-sm:text-xs
                      ${location.pathname.includes("rediger")
                        ? "bg-cyan-100 text-cyan-600"
                        : "text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"}`}
                >
                    Rediger
                </NavLink>
            </nav>
        </div>
    );
};

export default ProfileTabMenu;