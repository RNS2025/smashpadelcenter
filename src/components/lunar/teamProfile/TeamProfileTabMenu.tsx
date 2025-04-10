import {NavLink, useLocation} from "react-router-dom";

export const TeamProfileTabMenu = () => {
    const location = useLocation();

    return (
        <div>
            <div className="block">
                <div className="">
                    <nav className="flex gap-6 text-lg font-medium" aria-label="Tabs">
                        {/* Spillere Tab */}
                        <NavLink
                            to={`spillere`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4
                                ${location.pathname.includes("spillere")
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"}
                            `}
                        >
                            Spillere
                        </NavLink>

                        {/* Tabeloversigt Tab */}
                        <NavLink
                            to={`tabeloversigt`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4
                                ${location.pathname.includes("tabeloversigt")
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"}
                            `}
                        >
                            Tabeloversigt
                        </NavLink>

                        {/* Kampe Tab */}
                        <NavLink
                            to={`kampe`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4
                                ${location.pathname.includes("kampe")
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"}
                            `}
                        >
                            Kampe
                        </NavLink>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default TeamProfileTabMenu;