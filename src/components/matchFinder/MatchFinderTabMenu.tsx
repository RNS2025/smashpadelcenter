import { NavLink, useLocation } from "react-router-dom";

export const MatchFinderTabMenu = () => {
  const location = useLocation();

  return (
    <div>
      <div className="block">
        <div>
          <nav className="flex gap-6" aria-label="Tabs">
            <NavLink
              to={`/makkerbørs/allekampe`}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium
                                ${
                                  location.pathname.includes("allekampe")
                                    ? "border-cyan-500 text-cyan-500"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"
                                }
                            `}
            >
              Alle Kampe
            </NavLink>

            <NavLink
              to={`/makkerbørs/tilmeldt`}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium
                                ${
                                  location.pathname.includes("tilmeldt")
                                    ? "border-cyan-500 text-cyan-500"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"
                                }
                            `}
            >
              Tilmeldt
            </NavLink>

            <NavLink
              to={`/makkerbørs/afventer`}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium
                                ${
                                  location.pathname.includes("afventer")
                                    ? "border-cyan-500 text-cyan-500"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"
                                }
                            `}
            >
              Afventer
            </NavLink>

            <NavLink
              to={`/makkerbørs/bekraeftet`}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium
                                ${
                                  location.pathname.includes("bekraeftet")
                                    ? "border-cyan-500 text-cyan-500"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 transition duration-300"
                                }
                            `}
            >
              Bekræftet
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default MatchFinderTabMenu;
