import {NavLink, useLocation} from "react-router-dom";

export const LunarTabMenu = () => {
    const location = useLocation();

    return (
        <div>
            <nav className="flex gap-6" aria-label="Tabs">
                        {/* Lunar Tab */}
                        <NavLink
                            to={`/holdligaer/lunarligaherrer`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm max-sm:text-xs
                                ${location.pathname.includes("lunarligaherrer")
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"}
                            `}
                        >
                            Lunar Ligaen
                        </NavLink>

                        {/* Lunar Kvinder Tab */}
                        <NavLink
                            to={`/holdligaer/lunarliga4p`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm max-sm:text-xs
                                ${location.pathname.includes("lunarliga4p")
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"}
                            `}
                        >
                            Lunar Ligaen 4P (Kvinder)
                        </NavLink>

                        {/* HH-Listen Tab */}
                        <NavLink
                            to={`/holdligaer/hh-listen`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm max-sm:text-xs
                                ${location.pathname.includes("hh-listen")
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"}
                            `}
                        >
                            HH-Listen
                        </NavLink>
                    </nav>
        </div>
    );
};

export default LunarTabMenu;