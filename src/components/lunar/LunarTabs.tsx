import {NavLink, useLocation} from "react-router-dom";

export const LunarTabs = () => {
    const location = useLocation();

    return (
        <div>
            <div className="block">
                <div className="">
                    <nav className="flex gap-6" aria-label="Tabs">
                        {/* Lunar Horsens Tab */}
                        <NavLink
                            to={`/holdligaer/lunarliga`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium
                                ${location.pathname.includes("lunarliga")
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"}
                            `}
                        >
                            Lunar Ligaen - Forår 2025
                        </NavLink>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default LunarTabs;