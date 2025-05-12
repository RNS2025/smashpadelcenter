import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  OrganisationEvent,
  OrganisationEventsResponse,
  Pool,
  PoolsInfoResponse,
  StandingsResponse, // Opdateret til at inkludere StandingsModel
  MatchesSectionModel,
  GroupedPools,
  Round as RoundType,
  Match as MatchType,
  TeamStanding, // Ny import
} from "../../../types/LunarGlobal"; // Antager at interfaces.ts er i samme mappe eller juster sti

const API_BASE_URL = "https://api.rankedin.com/v1";

// --- Indlejrede UI-komponenter (stylet med Tailwind CSS) ---
// (Inkludér LoadingSpinner, AlertMessage, StyledSelect, TabButton, SearchInput komponenter her)
// ... (kopiér komponentdefinitionerne fra tidligere svar)
// Sørg for, at disse komponenter er præcis som i de tidligere korrekte svar.
// StyledSelectProps, TabButtonProps, LoadingSpinnerProps, AlertMessageProps, SearchInputProps grænseflader skal også inkluderes

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  message?: string;
  className?: string;
}
interface AlertMessageProps {
  type: "error" | "success" | "info";
  message: string;
  onClose?: () => void;
}
interface StyledSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  labelClassName?: string;
}
interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  message,
  className = "",
}) => {
  const sizeClasses = {
    small: "h-5 w-5",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };
  return (
    <div
      className={`flex flex-col items-center justify-center py-8 ${className}`}
    >
      <div
        className={`animate-spin rounded-full border-t-4 border-b-4 border-brand-primary ${sizeClasses[size]}`}
      ></div>
      {message && <p className="mt-3 text-slate-400 text-sm">{message}</p>}
    </div>
  );
};

const AlertMessage: React.FC<AlertMessageProps> = ({
  type,
  message,
  onClose,
}) => {
  const baseClasses =
    "p-3.5 rounded-lg shadow-md mb-6 flex items-start animate-fadeIn text-xs sm:text-sm";
  const typeClasses = {
    error: "bg-red-500/10 text-red-300 border border-red-500/30",
    success: "bg-green-500/10 text-green-300 border border-green-500/30",
    info: "bg-blue-500/10 text-blue-300 border border-blue-500/30",
  };

  const Icon = () => {
    if (type === "error")
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    if (type === "success")
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-2 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <Icon />
      <span className="flex-grow">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="-my-0.5 -mr-0.5 ml-2.5 p-1 rounded-md hover:bg-white/10 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

const StyledSelect: React.FC<StyledSelectProps> = ({
  label,
  options,
  placeholder,
  id,
  className = "",
  labelClassName = "",
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className={`block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          {...props}
          className="w-full pl-3 pr-10 py-2 bg-slate-750 border border-slate-600 text-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all duration-150 appearance-none text-sm"
        >
          {placeholder && (
            <option value="" disabled className="text-slate-500">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-slate-700 text-slate-200"
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<TabButtonProps> = ({
  isActive,
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      {...props}
      className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-slate-850
        ${
          isActive
            ? "bg-brand-primary text-white shadow-md hover:bg-opacity-90"
            : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-slate-100"
        }
        ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// --- Hovedsidekomponent ---
const LeagueStandingsPage: React.FC = () => {
  const [organisationEvents, setOrganisationEvents] = useState<
    OrganisationEvent[]
  >([]);
  const [selectedEvent, setSelectedEvent] = useState<OrganisationEvent | null>(
    null
  );
  const [pools, setPools] = useState<Pool[]>([]);
  const [groupedPools, setGroupedPools] = useState<GroupedPools>({});
  const [selectedPoolGroupKey, setSelectedPoolGroupKey] = useState<
    string | null
  >(null);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [standings, setStandings] = useState<MatchesSectionModel | null>(null);
  // Ny tilstand for generelle stillingsdata
  const [generalStandings, setGeneralStandings] = useState<
    TeamStanding[] | null
  >(null);

  const [teamSearchTerm] = useState<string>("");

  const [loadingStates, setLoadingStates] = useState({
    events: false,
    pools: false,
    standings: false,
  });
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchDataInternal = useCallback(async <T,>(url: string): Promise<T> => {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Netværkssvaret var ikke ok" }));
      throw new Error(
        errorData.message || `HTTP-fejl! status: ${response.status}`
      );
    }
    return response.json() as Promise<T>;
  }, []);

  const groupPoolsByNameInternal = useCallback(
    (poolsToGroup: Pool[]): GroupedPools => {
      const grouped: GroupedPools = {};
      poolsToGroup.forEach((pool) => {
        const parts = pool.Name.split(" - ");
        let groupName = pool.Name;
        if (parts.length > 2) {
          groupName = `${parts[0]} - ${parts[1]}`;
        } else if (
          parts.length === 2 &&
          ![
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H",
            "I",
            "J",
            "K",
            "L",
            "M",
            "N",
            "O",
            "P",
          ].includes(parts[1])
        ) {
          groupName = pool.Name;
        } else if (parts.length === 2) {
          groupName = parts[0];
        } else {
          groupName = "Andet";
        }

        if (!grouped[groupName]) {
          grouped[groupName] = [];
        }
        grouped[groupName].push(pool);
      });
      const sortedGrouped: GroupedPools = {};
      Object.keys(grouped)
        .sort()
        .forEach((key) => {
          sortedGrouped[key] = grouped[key];
          sortedGrouped[key].sort((a, b) => a.Name.localeCompare(b.Name));
        });
      return sortedGrouped;
    },
    []
  );

  // --- Effekter til datahentning ---
  useEffect(() => {
    const getEvents = async () => {
      setLoadingStates((prev) => ({ ...prev, events: true }));
      setError(null);
      try {
        const data = await fetchDataInternal<OrganisationEventsResponse>(
          `${API_BASE_URL}/Organization/GetOrganisationEventsAsync?organisationId=1420&IsFinished=false&Language=da&EventType=3&skip=0&take=20`
        );
        setOrganisationEvents(data.payload);
      } catch (err) {
        setError((err as Error).message);
        console.error("Kunne ikke hente begivenheder:", err);
      } finally {
        setLoadingStates((prev) => ({ ...prev, events: false }));
      }
    };
    getEvents();
  }, [fetchDataInternal]);

  useEffect(() => {
    if (!selectedEvent) {
      setPools([]);
      setGroupedPools({});
      setSelectedPoolGroupKey(null);
      setSelectedPool(null);
      setStandings(null);
      setGeneralStandings(null); // Ryd også generelle stillinger
      return;
    }
    const getPools = async () => {
      setLoadingStates((prev) => ({ ...prev, pools: true, standings: false }));
      setError(null);
      setPools([]);
      setGroupedPools({});
      setSelectedPoolGroupKey(null);
      setSelectedPool(null);
      setStandings(null);
      setGeneralStandings(null); // Ryd også generelle stillinger
      try {
        const data = await fetchDataInternal<PoolsInfoResponse>(
          `${API_BASE_URL}/teamleague/GetPoolsInfoAsync?id=${selectedEvent.eventId}`
        );
        setPools(data.Pools);
        setGroupedPools(groupPoolsByNameInternal(data.Pools));
      } catch (err) {
        setError((err as Error).message);
        console.error("Kunne ikke hente puljer:", err);
      } finally {
        setLoadingStates((prev) => ({ ...prev, pools: false }));
      }
    };
    getPools();
  }, [selectedEvent, fetchDataInternal, groupPoolsByNameInternal]);

  useEffect(() => {
    if (!selectedPool || !selectedEvent) {
      setStandings(null);
      setGeneralStandings(null); // Ryd også generelle stillinger
      return;
    }
    const getStandings = async () => {
      setLoadingStates((prev) => ({ ...prev, standings: true }));
      setError(null);
      setStandings(null); // Ryd gamle data
      setGeneralStandings(null); // Ryd gamle data for generelle stillinger
      try {
        const data = await fetchDataInternal<StandingsResponse>(
          `${API_BASE_URL}/teamleague/GetStandingsSectionAsync?teamleagueId=${selectedEvent.eventId}&poolid=${selectedPool.Id}&language=da`
        );
        setStandings(data.MatchesSectionModel);

        // --- Uddrag og sæt generelle stillinger ---
        if (data.Standings?.ScoresViewModels) {
          // Sikker adgang til det indlejrede array
          setGeneralStandings(data.Standings.ScoresViewModels);
        } else {
          // Håndter tilfælde, hvor generelle stillingsdata muligvis mangler
          console.warn(
            "Generelle stillingsdata (Standings.ScoresViewModels) blev ikke fundet i svaret."
          );
          setGeneralStandings([]); // Sæt til tomt array for at indikere ingen data
        }
        // ----------------------------------------
      } catch (err) {
        setError((err as Error).message);
        console.error("Kunne ikke hente stillinger:", err);
        setGeneralStandings(null); // Ryd ved fejl
      } finally {
        setLoadingStates((prev) => ({ ...prev, standings: false }));
      }
    };
    getStandings();
  }, [selectedPool, selectedEvent, fetchDataInternal]);

  // --- Håndterere ---
  const handleEventChange = (
    eventReact: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const eventId = parseInt(eventReact.target.value, 10);
    setSelectedEvent(
      organisationEvents.find((e) => e.eventId === eventId) || null
    );
  };

  const handlePoolGroupChange = (groupKey: string) => {
    setSelectedPoolGroupKey(groupKey);
    setSelectedPool(null);
    setStandings(null);
    setGeneralStandings(null); // Ryd generelle stillinger
  };

  const handlePoolChange = (poolId: number) => {
    const poolToSelect = (
      selectedPoolGroupKey ? groupedPools[selectedPoolGroupKey] : []
    ).find((p) => p.Id === poolId);
    setSelectedPool(poolToSelect || null);
    // Hentning af stillinger udløses af useEffect, når selectedPool ændres
  };
  // --- Memoriserede værdier ---
  const currentPoolsInGroup = useMemo(
    () =>
      selectedPoolGroupKey ? groupedPools[selectedPoolGroupKey] || [] : [],
    [selectedPoolGroupKey, groupedPools]
  );

  const eventOptions = useMemo(
    () =>
      organisationEvents.map((event) => ({
        value: event.eventId,
        label: event.eventName,
      })),
    [organisationEvents]
  );

  const showPoolGroupSelection = selectedEvent && teamSearchTerm.trim() === "";

  const pageBackground = "bg-slate-950";

  return (
    <div
      className={`min-h-screen ${pageBackground} text-slate-200 font-sans py-5 sm:py-7 px-2.5 sm:px-4`}
    >
      <div className="container mx-auto max-w-6xl">
        <header className="pt-3 pb-6 sm:pb-8 text-center relative">
          <div
            className="absolute inset-x-0 top-0 h-32 -z-10 opacity-20 blur-3xl
                        bg-gradient-to-tr from-brand-primary via-brand-secondary to-brand-accent
                        dark:from-brand-primary/30 dark:via-brand-secondary/30 dark:to-brand-accent/30"
          ></div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-50 relative">
            Lunar Liga
          </h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            Følg live stillinger, divisioner og serier for igangværende
            lunar-ligaer.
          </p>
        </header>

        {error && (
          <AlertMessage
            type="error"
            message={`Fejl: ${error}. Prøv igen.`}
            onClose={clearError}
          />
        )}

        <section className="bg-slate-800/60 backdrop-blur-md shadow-xl rounded-lg p-4 sm:p-5 mb-6 sm:mb-8 animate-fadeInDown">
          <div className="space-y-4 sm:space-y-5">
            <div>
              <StyledSelect
                id="event-select"
                label="Liga Begivenhed"
                value={selectedEvent?.eventId || ""}
                onChange={handleEventChange}
                disabled={
                  loadingStates.events || organisationEvents.length === 0
                }
                options={eventOptions}
                placeholder="-- Vælg Liga --"
              />
              {loadingStates.events && (
                <p className="text-xxs text-brand-primary/80 mt-1 animate-pulseSlow">
                  Indlæser ligaer...
                </p>
              )}
            </div>

            {selectedEvent && (
              <div className="border-t border-slate-700/70 pt-4 sm:pt-5 space-y-3.5">
                {/* Valg af Division/Seriegruppe (Skjult ved søgning) */}
                {showPoolGroupSelection && (
                  <div className="border-t border-slate-700/70 pt-4 sm:pt-5 space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
                        Division / Seriegruppe
                      </label>
                      {loadingStates.pools && teamSearchTerm.trim() === "" && (
                        <p className="text-xxs text-brand-primary/80 animate-pulseSlow">
                          Indlæser grupper...
                        </p>
                      )}
                      {!loadingStates.pools &&
                        Object.keys(groupedPools).length === 0 &&
                        !error && (
                          <p className="text-xs text-slate-500 italic">
                            Ingen divisionsgrupper for denne liga.
                          </p>
                        )}
                      {Object.keys(groupedPools).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {Object.keys(groupedPools).map((groupKey) => (
                            <TabButton
                              key={groupKey}
                              onClick={() => handlePoolGroupChange(groupKey)}
                              isActive={selectedPoolGroupKey === groupKey}
                              disabled={loadingStates.pools}
                            >
                              {groupKey}
                            </TabButton>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedPoolGroupKey && currentPoolsInGroup.length > 0 && (
                      <div className="border-t border-slate-700/50 pt-3.5 sm:pt-4">
                        <label className="block text-xxs sm:text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
                          Pulje i "{selectedPoolGroupKey}"
                        </label>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {currentPoolsInGroup.map((pool) => (
                            <TabButton
                              key={pool.Id}
                              onClick={() => handlePoolChange(pool.Id)}
                              isActive={selectedPool?.Id === pool.Id}
                              disabled={loadingStates.pools}
                            >
                              {pool.Name.replace(
                                `${selectedPoolGroupKey} - `,
                                ""
                              ) || pool.Name}
                            </TabButton>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Betinget gengivelse for puljenavnets overskrift og indholdssektioner */}
        {selectedPool && !loadingStates.standings && (
          <>
            {/* Generel Stillings Tabel */}
            {/* Vis kun, hvis generalStandings-tilstanden ikke er null/undefined og har elementer */}
            {generalStandings && generalStandings.length > 0 ? (
              <section className="animate-fadeIn mt-5 mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-slate-100 mb-3">
                  Generel Stilling:{" "}
                  <span className="text-brand-primary">
                    {selectedPool.Name}
                  </span>
                </h3>
                <div className="bg-slate-800/70 backdrop-blur-sm shadow-lg rounded-md overflow-hidden border border-slate-700/60">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700/60">
                      <thead className="bg-slate-750/40">
                        <tr>
                          <th
                            scope="col"
                            className="px-2.5 sm:px-3 py-2 text-left text-xxs sm:text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            Rang
                          </th>
                          <th
                            scope="col"
                            className="px-2.5 sm:px-3 py-2 text-left text-xxs sm:text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            Hold
                          </th>
                          <th
                            scope="col"
                            className="px-2.5 sm:px-3 py-2 text-center text-xxs sm:text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            Spillet
                          </th>
                          <th
                            scope="col"
                            className="px-2.5 sm:px-3 py-2 text-center text-xxs sm:text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            Sejre
                          </th>
                          <th
                            scope="col"
                            className="px-2.5 sm:px-3 py-2 text-center text-xxs sm:text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            Nederlag
                          </th>
                          <th
                            scope="col"
                            className="px-2.5 sm:px-3 py-2 text-center text-xxs sm:text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            Kampe
                            <br />
                            Diff
                          </th>
                          <th
                            scope="col"
                            className="px-2.5 sm:px-3 py-2 text-center text-xxs sm:text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            Holdkampe
                            <br />
                            Diff
                          </th>
                          <th
                            scope="col"
                            className="px-2.5 sm:px-3 py-2 text-center text-xxs sm:text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            Point
                            <br />
                            Diff
                          </th>
                          <th
                            scope="col"
                            className="px-2.5 sm:px-3 py-2 text-center text-xxs sm:text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            Point
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/60">
                        {generalStandings.map((team) => (
                          <tr
                            key={team.ParticipantId}
                            className="hover:bg-slate-700/50 transition-colors duration-100"
                          >
                            <td className="px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs text-center text-slate-300 tabular-nums">
                              {team.Standing}
                            </td>
                            <td className="px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs text-slate-200 truncate max-w-[120px] sm:max-w-[180px] font-medium">
                              {team.ParticipantName}
                            </td>
                            <td className="px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs text-center text-slate-300 tabular-nums">
                              {team.Played}
                            </td>
                            <td className="px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs text-center text-green-400 tabular-nums">
                              {team.Wins}
                            </td>
                            <td className="px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs text-center text-red-400 tabular-nums">
                              {team.Losses}
                            </td>
                            <td
                              className={`px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs text-center tabular-nums ${
                                team.GamesDifference >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {team.GamesDifference >= 0 ? "+" : ""}
                              {team.GamesDifference}
                            </td>
                            <td
                              className={`px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs text-center tabular-nums ${
                                team.TeamGamesDifference >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {team.TeamGamesDifference >= 0 ? "+" : ""}
                              {team.TeamGamesDifference}
                            </td>
                            <td
                              className={`px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs text-center tabular-nums ${
                                team.PointsDifference >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {team.PointsDifference >= 0 ? "+" : ""}
                              {team.PointsDifference}
                            </td>
                            <td className="px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs text-center font-semibold text-brand-primary tabular-nums">
                              {team.MatchPoints}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ) : (
              // Valgfri: Besked, hvis stillinger forventes, men ikke er tilgængelige (f.eks. ny pulje uden kampe endnu)
              !loadingStates.standings &&
              !error &&
              selectedPool &&
              generalStandings !== null &&
              generalStandings.length === 0 && (
                <div className="bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-md shadow-lg text-center border border-slate-700/60 mb-6 mt-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto h-10 w-10 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 17.25v-.375m0 0H4.5m4.5 0H15M9 17.25a3 3 0 11-3-3m3 3a3 3 0 10-3-3m3 3H9m9 0H19.5m-4.5 0a3 3 0 11-3-3m3 3a3 3 0 10-3-3m3 3H15m0 0v-.375m0-.75H9m6 0H9m6 0v-.375m0 0a3 3 0 11-3-3m3 3a3 3 0 10-3-3m3 3H15m0 0h.008v.008zm0 0H19.5ZM19.5 12a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.0001 0 004.5 12m15 0v6.75a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18.75V12m15 0a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.0001 0 004.5 12m15 0h-.008v-.008zm0 0H4.5"
                    />
                  </svg>
                  <p className="mt-2.5 text-sm sm:text-base text-slate-400">
                    Generelle stillingsdata er endnu ikke tilgængelige for denne
                    pulje.
                  </p>
                </div>
              )
            )}

            {/* Kampsektion */}
            {standings && standings.Rounds.length > 0 ? (
              <section className="animate-fadeIn mt-5">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-2.5 sm:mb-3">
                  Kampe:{" "}
                  <span className="text-brand-primary">
                    {selectedPool?.Name}
                  </span>
                </h2>
                {standings.Rounds.map((round: RoundType) => (
                  <div
                    key={round.RoundNumber}
                    className="mb-6 bg-slate-800/70 backdrop-blur-sm shadow-lg rounded-md overflow-hidden border border-slate-700/60"
                  >
                    <div className="bg-slate-750/70 px-3.5 sm:px-4 py-2.5 border-b border-slate-600/60">
                      <h3 className="text-sm sm:text-base font-semibold text-slate-100">
                        Runde {round.RoundNumber}
                        <span className="text-xxs sm:text-xs text-slate-400 ml-1.5 tracking-tight">
                          ({round.RoundDate})
                        </span>
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-slate-750/40">
                          <tr>
                            {[
                              "Tid",
                              "Hjemme",
                              "Resultat",
                              "Ude",
                              "Sted",
                              "Info",
                            ].map((header) => (
                              <th
                                key={header}
                                scope="col"
                                className="px-2.5 sm:px-3 py-2 text-left text-xxs sm:text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60">
                          {round.Matches.map((match: MatchType) => (
                            <tr
                              key={match.MatchId}
                              className="hover:bg-slate-700/50 transition-colors duration-100"
                            >
                              <td className="px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs text-slate-300 tabular-nums">
                                {match.Date}
                              </td>
                              <td
                                className={`px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs truncate max-w-[100px] sm:max-w-[150px] ${
                                  match.Team1.IsWinner
                                    ? "font-semibold text-green-400"
                                    : "text-slate-200"
                                }`}
                              >
                                {match.Team1.Name}
                              </td>
                              <td className="px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-center">
                                {match.ShowResults ? (
                                  <>
                                    <span
                                      className={`px-1.5 py-0.5 rounded-sm text-xxs font-mono ${
                                        match.Team1.Result ===
                                        match.Team2.Result
                                          ? "bg-slate-600 text-slate-300"
                                          : match.Team1.IsWinner
                                          ? "bg-green-600/30 text-green-300"
                                          : "bg-slate-700 text-slate-300"
                                      }`}
                                    >
                                      {match.Team1.Result}
                                    </span>
                                    <span className="mx-0.5 text-xxs text-slate-500">
                                      -
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded-sm text-xxs font-mono ${
                                        match.Team1.Result ===
                                        match.Team2.Result
                                          ? "bg-slate-600 text-slate-300"
                                          : match.Team2.IsWinner
                                          ? "bg-green-600/30 text-green-300"
                                          : "bg-slate-700 text-slate-300"
                                      }`}
                                    >
                                      {match.Team2.Result}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xxs text-slate-500 italic">
                                    Ikke tilgængelig
                                  </span>
                                )}
                              </td>
                              <td
                                className={`px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs truncate max-w-[100px] sm:max-w-[150px] ${
                                  match.Team2.IsWinner
                                    ? "font-semibold text-green-400"
                                    : "text-slate-200"
                                }`}
                              >
                                {match.Team2.Name}
                              </td>
                              <td className="px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs text-slate-400 truncate max-w-[100px] sm:max-w-[120px]">
                                {match.Location}
                              </td>
                              <td className="px-2.5 sm:px-3 py-2.5 whitespace-nowrap text-xxs sm:text-xs">
                                <a
                                  href={`https://rankedin.com${match.Url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-primary/80 hover:text-brand-primary hover:underline items-center inline-flex group"
                                  title={`Detaljer for kampen på ${
                                    match.Details.LocationName || match.Location
                                  } den ${match.Details.Time}`}
                                >
                                  Vis
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-2.5 w-2.5 ml-0.5 group-hover:translate-x-0.5 transition-transform"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </section>
            ) : (
              // Valgfri: Besked, hvis kampdata forventes, men ikke er tilgængelige
              !loadingStates.standings &&
              !error &&
              selectedPool &&
              generalStandings !== null &&
              standings?.Rounds?.length === 0 && (
                <div className="bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-md shadow-lg text-center border border-slate-700/60 mt-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto h-10 w-10 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.001c0 .621.504 1.125 1.125 1.125z"
                    />
                  </svg>
                  <p className="mt-2.5 text-sm sm:text-base text-slate-400">
                    Ingen kampe fundet.
                  </p>
                  <p className="text-xxs sm:text-xs text-slate-500">
                    Ingen planlagte/afsluttede kampe i denne pulje endnu.
                  </p>
                </div>
              )
            )}

            {/* Besked, hvis hverken kampe eller generelle stillinger er tilgængelige */}
            {!loadingStates.standings &&
              !error &&
              selectedPool &&
              generalStandings !== null &&
              generalStandings.length === 0 &&
              standings?.Rounds?.length === 0 && (
                <div className="bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-md shadow-lg text-center border border-slate-700/60 mt-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto h-10 w-10 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  <p className="mt-2.5 text-sm sm:text-base text-slate-400">
                    Ingen Stillinger eller Kampe Tilgængelige
                  </p>
                  <p className="text-xxs sm:text-xs text-slate-500">
                    Data for denne pulje kunne ikke indlæses eller er ikke
                    tilgængelige.
                  </p>
                </div>
              )}
          </>
        )}

        {/* Vis indlæsningsspinner specifikt for stillinger eller puljer */}
        {loadingStates.standings && (
          <LoadingSpinner message="Indlæser stillinger..." className="mt-5" />
        )}

        {/* Vis puljeindlæsningsspinner kun når IKKE stillinger indlæses og IKKE søges */}
        {loadingStates.pools &&
          !loadingStates.standings &&
          teamSearchTerm.trim() === "" && (
            <LoadingSpinner message="Indlæser puljer..." className="mt-5" />
          )}
      </div>
    </div>
  );
};

export default LeagueStandingsPage;
