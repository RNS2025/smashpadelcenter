import {NavLink} from "react-router-dom";

export const PrivateEventTabMenu = ({joinRequestsCount}: {
    joinRequestsCount: number;
}) => {
    return (
        <div>
            <div className="block">
                <div>
                    <nav className="flex gap-6" aria-label="Tabs">
                        <NavLink
                            to={`/privat-arrangementer/minearrangementer`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium
                                ${
                                location.pathname.includes("minearrangementer")
                                    ? "border-cyan-500 text-cyan-500"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"
                            }
                            `}
                        >
                            Mine arrangementer
                            {joinRequestsCount > 0 && (
                                <h1 className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">{joinRequestsCount}</h1>
                            )}
                        </NavLink>

                        <NavLink
                            to={`/privat-arrangementer/allearrangementer`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium
                                ${
                                location.pathname.includes("allearrangementer")
                                    ? "border-cyan-500 text-cyan-500"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"
                            }
                            `}
                        >
                            Alle arrangementer
                        </NavLink>

                        {/*
                        <NavLink
                            to={`/privat-arrangementer/invitationer`}
                            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium
                                ${
                                location.pathname.includes("invitationer")
                                    ? "border-cyan-500 text-cyan-500"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"
                            }
                            `}
                        >
                            Invitationer
                        </NavLink>
                        */}
                    </nav>
                </div>
            </div>
        </div>
    );
}

export default PrivateEventTabMenu;