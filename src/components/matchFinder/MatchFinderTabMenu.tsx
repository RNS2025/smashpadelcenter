import { NavLink, useLocation } from "react-router-dom";

export const MatchFinderTabMenu = ({
  joinRequestsCount,
}: {
  joinRequestsCount: number;
}) => {
  const location = useLocation();

  return (
    <div>
      <nav className="flex gap-6" aria-label="Tabs">
        <NavLink
          to={`/makkerbørs/match/allekampe`}
          className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium
                                ${
                                  location.pathname.includes("allekampe")
                                    ? "border-cyan-500 text-cyan-500"
                                    : "border-transparent text-gray-500"
                                }
                            `}
        >
          Alle Kampe
        </NavLink>

        <NavLink
          to={`/makkerbørs/match/minekampe`}
          className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium
                                ${
                                  location.pathname.includes("minekampe")
                                    ? "border-cyan-500 text-cyan-500"
                                    : "border-transparent text-gray-500"
                                }`}
        >
          Mine kampe
          {joinRequestsCount > 0 && (
            <h1 className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
              {joinRequestsCount}
            </h1>
          )}
        </NavLink>

        <NavLink
          to={`/makkerbørs/match/afventer`}
          className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium
                                ${
                                  location.pathname.includes("afventer")
                                    ? "border-cyan-500 text-cyan-500"
                                    : "border-transparent text-gray-500"
                                }
                            `}
        >
          Afventer
        </NavLink>
      </nav>
    </div>
  );
};

export default MatchFinderTabMenu;
