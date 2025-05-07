import {NavLink, useLocation} from "react-router-dom";

export const TournamentInfoTabMenu = () => {
    const location = useLocation();

    return (
                <div>
                    <nav className="flex gap-6 text-lg font-medium" aria-label="Tabs">

                        <NavLink
                            to={`briefing`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4
                                ${location.pathname.includes("briefing")
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-gray-500"}
                            `}
                        >
                            Briefing
                        </NavLink>


                        <NavLink
                            to={`generelt`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4
                                ${location.pathname.includes("generelt")
                                ? "border-cyan-500 text-cyan-500"
                                : "border-transparent text-gray-500"}
                            `}
                        >
                            Generelt
                        </NavLink>
                    </nav>
        </div>
    );
};

export default TournamentInfoTabMenu;