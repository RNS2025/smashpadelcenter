import {NavLink, useLocation} from "react-router-dom";

export const TeamProfileTabMenu = () => {
    const location = useLocation();

    return (
                <div>
                    <nav className="flex gap-6 text-lg font-medium" aria-label="Tabs">
                        {/* Spillere Tab */}
                        <NavLink
                            to={`spillere`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 max-sm:text-sm
                                ${location.pathname.includes("spillere")
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-gray-500"}
                            `}
                        >
                            Spillere
                        </NavLink>

                        {/* Tabeloversigt Tab */}
                        <NavLink
                            to={`tabeloversigt`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 max-sm:text-sm
                                ${location.pathname.includes("tabeloversigt")
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-gray-500"}
                            `}
                        >
                            Tabeloversigt
                        </NavLink>

                        {/* Kampe Tab */}
                        <NavLink
                            to={`kampe`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 max-sm:text-sm
                                ${location.pathname.includes("kampe")
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-gray-500"}
                            `}
                        >
                            Kampe
                        </NavLink>
                    </nav>
        </div>
    );
};

export default TeamProfileTabMenu;