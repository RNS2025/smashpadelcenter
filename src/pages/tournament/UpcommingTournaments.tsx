import { useEffect, useState, useMemo, useCallback, FC } from "react";
import axios from "axios";
import { format, parseISO, addDays, isBefore } from "date-fns";
import HomeBar from "../../components/misc/HomeBar"; // Assuming this exists
import Animation from "../../components/misc/Animation"; // Assuming this exists
import AlertMessage from "../../components/tournaments/check-in/AlertMessage"; // Assuming this exists

// --- Constants and Types (Ideally in separate constants.ts or types.ts files) ---
interface TournamentClass {
  Id: number;
  Name: string;
  MatchType: number;
  IsAlreadyJoined: boolean;
}

interface Tournament {
  EventId: number;
  EventName: string;
  Type: number;
  CountryShort: string;
  PosterUrl: string;
  Sport: number;
  StartDate: string;
  EndDate: string;
  OrganisationName: string;
  Address: string; // This will be updated from the GetInfoAsync call if available
  EventState: number;
  IsStreamPlanned: boolean;
  EventUrl: string;
  IsPremium: boolean;
  Classes?: TournamentClass[];
}

interface CachedData {
  tournaments: Tournament[];
  timestamp: string;
  from: number; // Stores the 'from' value for the next fetch based on cached data
}

const CACHE_KEY = "padel_tournaments_cache";
const CACHE_DURATION_DAYS = 1;

const VALID_DPF_CLASSES = [
  "DPF25",
  "DPF50",
  "DPF100",
  "DPF200",
  "DPF400",
  "DPF1000",
];

const REGIONS = [
  "Alle",
  "Hovedstaden",
  "Sjælland",
  "Syddanmark",
  "Midtjylland",
  "Nordjylland",
];

const MONTHS = [
  { value: "", label: "Alle Måneder" },
  { value: "01", label: "Januar" },
  { value: "02", label: "Februar" },
  { value: "03", label: "Marts" },
  { value: "04", label: "April" },
  { value: "05", label: "Maj" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

// --- Utility Functions (Ideally in a separate utils.ts file) ---
const getDPFBaseClass = (className: string): string | null => {
  if (!className) return null;
  const upperClassName = className.toUpperCase();
  for (const dpfClass of VALID_DPF_CLASSES) {
    if (upperClassName.includes(dpfClass.toUpperCase())) {
      return dpfClass;
    }
  }
  return null;
};

const getRegionFromAddress = (address: string): string => {
  if (!address) return "Ukendt";
  const lowerAddress = address.toLowerCase();
  if (
    lowerAddress.includes("københavn") ||
    lowerAddress.includes("copenhagen") ||
    lowerAddress.includes("frederiksberg")
  )
    return "Hovedstaden";
  if (
    lowerAddress.includes("roskilde") ||
    lowerAddress.includes("næstved") ||
    lowerAddress.includes("køge") ||
    (parseInt(lowerAddress.match(/\b(\d{4})\b/)?.[0] || "0") >= 4000 &&
      parseInt(lowerAddress.match(/\b(\d{4})\b/)?.[0] || "0") <= 4999)
  )
    return "Sjælland";
  if (
    lowerAddress.includes("odense") ||
    lowerAddress.includes("esbjerg") ||
    lowerAddress.includes("kolding") ||
    (parseInt(lowerAddress.match(/\b(\d{4})\b/)?.[0] || "0") >= 5000 &&
      parseInt(lowerAddress.match(/\b(\d{4})\b/)?.[0] || "0") <= 6999)
  )
    return "Syddanmark";
  if (
    lowerAddress.includes("aarhus") ||
    lowerAddress.includes("viborg") ||
    lowerAddress.includes("horsens") ||
    lowerAddress.includes("skanderborg") ||
    (parseInt(lowerAddress.match(/\b(\d{4})\b/)?.[0] || "0") >= 7000 &&
      parseInt(lowerAddress.match(/\b(\d{4})\b/)?.[0] || "0") <= 8999)
  )
    return "Midtjylland";
  if (
    lowerAddress.includes("aalborg") ||
    lowerAddress.includes("frederikshavn") ||
    lowerAddress.includes("hjørring") ||
    (parseInt(lowerAddress.match(/\b(\d{4})\b/)?.[0] || "0") >= 9000 &&
      parseInt(lowerAddress.match(/\b(\d{4})\b/)?.[0] || "0") <= 9999)
  )
    return "Nordjylland";

  const postalCodeMatch = address.match(/\b(\d{4})\b/);
  if (postalCodeMatch) {
    const num = parseInt(postalCodeMatch[0]);
    if (num >= 1000 && num <= 2999) return "Hovedstaden";
  }
  return "Ukendt";
};

const getPostalCodeFromAddress = (address: string): string => {
  if (!address) return "";
  const postalCodeMatch = address.match(/\b\d{4}\b/);
  return postalCodeMatch ? postalCodeMatch[0] : "";
};

// --- Reusable UI Components (Each would be in its own .tsx file ideally) ---

const RefreshIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-2"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const LoadingSpinner: FC<{ size?: "small" | "large" }> = ({
  size = "large",
}) => (
  <div className={`flex justify-center ${size === "large" ? "my-12" : "my-8"}`}>
    <div
      className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${
        size === "large" ? "h-12 w-12" : "h-8 w-8"
      }`}
    ></div>
  </div>
);

interface TournamentCardProps {
  tournament: Tournament;
}

const TournamentCard: FC<TournamentCardProps> = ({ tournament }) => {
  const placeholderImage =
    "https://via.placeholder.com/300x200/E0E0E0/9E9E9E?text=No+Image";
  const eventUrlBase = "https://rankedin.com";

  return (
    <div className="bg-slate-800 shadow-xl rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-300 flex flex-col">
      <div className="relative h-48 bg-slate-700">
        <img
          src={tournament.PosterUrl || placeholderImage}
          alt={`Poster for ${tournament.EventName}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImage;
          }}
        />
        {tournament.IsStreamPlanned && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2.5 py-1 rounded-full shadow-md flex items-center">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.59 4.14C17.33 3.88 17 3.77 16.65 3.77C16.3 3.77 15.97 3.88 15.71 4.14L12.99 6.86V5C12.99 4.45 12.54 4 11.99 4H3.99C3.44 4 2.99 4.45 2.99 5V15C2.99 15.55 3.44 16 3.99 16H12C12.55 16 13 15.55 13 15V13.14L15.71 15.85C15.97 16.12 16.31 16.23 16.65 16.23C16.99 16.23 17.33 16.12 17.59 15.85C18.11 15.33 18.11 14.5 17.59 13.98L14.28 10.67L17.59 7.36C18.11 6.84 18.11 6.02 17.59 5.5L17.59 4.14Z"></path>
            </svg>
            Live
          </div>
        )}
        {tournament.IsPremium && (
          <div className="absolute top-3 left-3 bg-yellow-400 text-slate-900 text-xs px-2.5 py-1 rounded-full shadow-md font-semibold">
            Premium
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow text-gray-300">
        <h3
          className="font-semibold text-lg mb-1 text-gray-100 line-clamp-2"
          title={tournament.EventName}
        >
          {tournament.EventName}
        </h3>
        <p
          className="text-sm text-gray-400 mb-1 line-clamp-1"
          title={tournament.Address || "Adresse ikke angivet"}
        >
          <span role="img" aria-label="Location pin">
            📍
          </span>{" "}
          {tournament.Address || "Adresse ikke angivet"}
        </p>
        <p className="text-sm text-gray-400 mb-3">
          <span role="img" aria-label="Calendar">
            📅
          </span>{" "}
          {format(parseISO(tournament.StartDate), "MMM d, yyyy")} -{" "}
          {format(parseISO(tournament.EndDate), "MMM d, yyyy")}
        </p>

        {tournament.Classes && tournament.Classes.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1.5 font-medium">
              Tilgængelige Klasser:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tournament.Classes.slice(0, 3).map((c) => (
                <span
                  key={c.Id}
                  className="bg-blue-500 bg-opacity-30 text-blue-300 text-xs px-2 py-1 rounded-full"
                >
                  {c.Name}
                </span>
              ))}
              {tournament.Classes.length > 3 && (
                <span className="bg-slate-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                  +{tournament.Classes.length - 3} mere
                </span>
              )}
            </div>
          </div>
        )}
        <div className="mt-auto pt-3">
          <a
            href={`${eventUrlBase}${tournament.EventUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block text-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
          >
            Se Detaljer
          </a>
        </div>
      </div>
    </div>
  );
};

interface TournamentFiltersProps {
  filters: {
    location: string;
    region: string[]; // Changed from string to string[]
    postalCode: string;
    month: string;
    class: string;
  };
  onFilterChange: (
    filterName: keyof TournamentFiltersProps["filters"],
    value: string | string[] // Allow string array for region
  ) => void;
  onPostalCodeChange: (value: string) => void;
  onClearFilters: () => void;
  onRefreshData: () => void;
  classOptions: { value: string; label: string }[];
  regionOptions: string[];
  monthOptions: { value: string; label: string }[];
  filterCount: number;
}

const TournamentFilters: FC<TournamentFiltersProps> = ({
  filters,
  onFilterChange,
  onPostalCodeChange,
  onClearFilters,
  onRefreshData,
  classOptions,
  regionOptions,
  monthOptions,
  filterCount,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleRegionClick = (region: string) => {
    let newRegions: string[];
    const currentRegions = filters.region;

    if (region === "Alle") {
      newRegions = ["Alle"];
    } else {
      if (currentRegions.includes("Alle")) {
        newRegions = [region]; // Start new selection, remove "Alle"
      } else if (currentRegions.includes(region)) {
        newRegions = currentRegions.filter((r) => r !== region);
        if (newRegions.length === 0) {
          newRegions = ["Alle"]; // If all are deselected, revert to "Alle"
        }
      } else {
        newRegions = [...currentRegions, region];
      }
    }
    onFilterChange("region", newRegions);
  };

  return (
    <div className="relative mb-6">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex justify-between items-center px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
      >
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zm0 6a1 1 0 000 2h14a1 1 0 100-2H3zm0 6a1 1 0 000 2h14a1 1 0 100-2H3z" />
          </svg>
          <span className="font-semibold">
            {filterCount > 0 ? `Filtre Anvendt (${filterCount})` : "Vis Filtre"}
          </span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform duration-200 ${
            isDropdownOpen ? "transform rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute z-20 mt-2 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-xl p-4 sm:p-6 animate-fadeInDown">
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1.5 text-gray-300">
              Region
            </label>
            <div className="flex flex-wrap gap-2">
              {regionOptions.map((region) => (
                <button
                  key={region}
                  onClick={() => handleRegionClick(region)} // Updated onClick handler
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 focus:ring-offset-slate-700 ${
                    filters.region.includes(region) // Check if region is in the array
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-slate-600 text-gray-200 hover:bg-slate-500"
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label
                htmlFor="locationFilter"
                className="block text-sm font-medium mb-1 text-gray-300"
              >
                Lokation (By/Adresse)
              </label>
              <input
                id="locationFilter"
                type="text"
                value={filters.location}
                onChange={(e) => onFilterChange("location", e.target.value)}
                placeholder="f.eks. København"
                className="w-full px-3 py-2 border border-slate-500 bg-slate-800 text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="postalCodeFilter"
                className="block text-sm font-medium mb-1 text-gray-300"
              >
                Postnummer
              </label>
              <input
                id="postalCodeFilter"
                type="text"
                value={filters.postalCode}
                onChange={(e) => onPostalCodeChange(e.target.value)}
                placeholder="f.eks. 2300"
                maxLength={4}
                className="w-full px-3 py-2 border border-slate-500 bg-slate-800 text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="monthFilter"
                className="block text-sm font-medium mb-1 text-gray-300"
              >
                Måned
              </label>
              <select
                id="monthFilter"
                value={filters.month}
                onChange={(e) => onFilterChange("month", e.target.value)}
                className="w-full px-3 py-2 border border-slate-500 bg-slate-800 text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none"
              >
                {monthOptions.map((month) => (
                  <option
                    key={month.value}
                    value={month.value}
                    className="bg-slate-800 text-gray-200"
                  >
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="classFilter"
                className="block text-sm font-medium mb-1 text-gray-300"
              >
                DPF Klasse
              </label>
              <select
                id="classFilter"
                value={filters.class}
                onChange={(e) => onFilterChange("class", e.target.value)}
                className="w-full px-3 py-2 border border-slate-500 bg-slate-800 text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none"
              >
                {classOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-slate-800 text-gray-200"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-slate-600">
            <button
              onClick={() => {
                onClearFilters();
                setIsDropdownOpen(false);
              }}
              className="w-full sm:w-auto px-4 py-2 text-sm bg-slate-600 hover:bg-slate-500 text-gray-200 rounded-md transition flex items-center justify-center"
              title="Ryd alle filtre"
            >
              Ryd Filtre
            </button>
            <button
              onClick={() => {
                onRefreshData();
                setIsDropdownOpen(false);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition flex items-center justify-center text-sm"
              title="Opdater data fra serveren"
            >
              <RefreshIcon />
              Opdater Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Page Component (UpcomingTournaments.tsx) ---
const UpcomingTournaments: FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState({ initial: true, more: false });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const initialFilters = {
    location: "",
    region: ["Alle"], // Default to an array with "Alle"
    postalCode: "",
    month: "",
    class: "",
  };
  const [filters, setFilters] = useState(initialFilters);

  const [from, setFrom] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const classOptions = useMemo(() => {
    const allClasses = new Set<string>(VALID_DPF_CLASSES);
    return [
      { value: "", label: "Alle Klasser" },
      ...Array.from(allClasses)
        .sort()
        .map((name) => ({ value: name, label: name })),
    ];
  }, []);

  const isCacheValid = useCallback((cachedData: CachedData): boolean => {
    if (!cachedData || !cachedData.timestamp) return false;
    const cacheDate = parseISO(cachedData.timestamp);
    const expiryDate = addDays(cacheDate, CACHE_DURATION_DAYS);
    return isBefore(new Date(), expiryDate);
  }, []);

  const saveToCache = useCallback(
    (dataToCache: Tournament[], currentFromOffset: number) => {
      const cacheData: CachedData = {
        tournaments: dataToCache,
        timestamp: new Date().toISOString(),
        from: currentFromOffset,
      };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (e) {
        console.error("Error saving to cache:", e);
      }
    },
    []
  );

  const loadFromCache = useCallback((): {
    data: Tournament[] | null;
    nextFrom: number;
  } => {
    try {
      const cachedJson = localStorage.getItem(CACHE_KEY);
      if (!cachedJson) return { data: null, nextFrom: 0 };
      const cachedData: CachedData = JSON.parse(cachedJson);
      if (!isCacheValid(cachedData)) {
        localStorage.removeItem(CACHE_KEY);
        return { data: null, nextFrom: 0 };
      }
      return { data: cachedData.tournaments, nextFrom: cachedData.from || 0 };
    } catch (e) {
      console.error("Error loading from cache:", e);
      localStorage.removeItem(CACHE_KEY);
      return { data: null, nextFrom: 0 };
    }
  }, [isCacheValid]);

  const fetchTournamentsData = useCallback(
    async (startFrom: number, isRefresh: boolean = false) => {
      setLoading((prev) => ({
        ...prev,
        initial: startFrom === 0 && !isRefresh, // Only initial load if not refresh and from 0
        more: startFrom > 0 && !isRefresh, // More load if not refresh and from > 0
      }));
      if (isRefresh) setLoading({ initial: true, more: false }); // Force initial true for refresh
      setError(null);

      if (!isRefresh && startFrom === 0) {
        const { data: cachedTournaments, nextFrom: cachedNextFrom } =
          loadFromCache();
        if (cachedTournaments && cachedTournaments.length > 0) {
          setTournaments(cachedTournaments);
          setFrom(cachedNextFrom);
          setHasMore(true);
          setLoading({ initial: false, more: false });
          setSuccessMessage("Turneringer indlæst fra cache.");
          setTimeout(() => setSuccessMessage(null), 2000);
          return;
        }
      }

      try {
        const response = await axios.get(
          "https://api.rankedin.com/v1/calendar/GetEventsAsync",
          {
            params: {
              from: startFrom,
              take: 25,
              country: 45,
              sport: 5,
              eventType: 4,
              eventState: 1,
              calendarAgeGroups: 2,
              calendarOrganization: 0,
            },
          }
        );

        const fetchedEventsData: Omit<Tournament, "Classes" | "Address">[] =
          response.data;
        if (!Array.isArray(fetchedEventsData)) {
          console.error("API response is not an array:", fetchedEventsData);
          throw new Error("Unexpected API response format.");
        }

        const tournamentsWithDetails: Tournament[] = await Promise.all(
          fetchedEventsData.map(async (eventData) => {
            try {
              const classResponse = await axios.get(
                `https://api.rankedin.com/v1/tournament/GetInfoAsync?id=${eventData.EventId}&language=en`
              );
              const sidebar = classResponse.data.TournamentSidebarModel;
              const tournamentSpecificAddress =
                sidebar.Address || "Adresse ikke specificeret"; // Corrected Address sourcing
              const filteredClasses = (sidebar.Classes || []).filter(
                (c: TournamentClass) => getDPFBaseClass(c.Name) !== null
              );
              return {
                ...eventData,
                Address: tournamentSpecificAddress,
                Classes: filteredClasses,
              };
            } catch (classError) {
              console.error(
                `Failed to fetch details for tournament ${eventData.EventId}:`,
                classError
              );
              return {
                ...eventData,
                Address: "Adresse ikke specificeret", // Corrected Address sourcing in catch
                Classes: [],
              };
            }
          })
        );

        const combinedTournaments =
          isRefresh || startFrom === 0
            ? tournamentsWithDetails
            : [...tournaments, ...tournamentsWithDetails];

        // De-duplicate tournaments based on EventId to prevent duplicate key warnings
        const uniqueTournamentsMap = new Map<number, Tournament>();
        combinedTournaments.forEach((tournament) => {
          if (!uniqueTournamentsMap.has(tournament.EventId)) {
            uniqueTournamentsMap.set(tournament.EventId, tournament);
          }
        });
        const newTournaments = Array.from(uniqueTournamentsMap.values());

        setTournaments(newTournaments);

        const nextFetchFrom = startFrom + tournamentsWithDetails.length; // Keep original logic for 'from'
        setFrom(nextFetchFrom);
        setHasMore(tournamentsWithDetails.length === 25);

        const MAX_CACHE_SIZE = 100;
        saveToCache(newTournaments.slice(0, MAX_CACHE_SIZE), nextFetchFrom);

        if (
          startFrom === 0 &&
          !isRefresh &&
          !localStorage
            .getItem(CACHE_KEY)
            ?.includes(newTournaments[0]?.EventName)
        ) {
          setSuccessMessage("Turneringer hentet med succes.");
        }
        if (isRefresh) setSuccessMessage("Data opdateret med succes.");
        setTimeout(() => setSuccessMessage(null), 2000);
      } catch (err) {
        console.error("Failed to fetch tournaments:", err);
        setError(
          "Kunne ikke hente turneringer. Tjek din forbindelse eller prøv igen senere."
        );
        setTimeout(() => setError(null), 5000);
      } finally {
        setLoading({ initial: false, more: false });
      }
    },
    [loadFromCache, saveToCache, tournaments]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchTournamentsData(0);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (
    filterName: keyof typeof filters,
    value: string | string[] // Updated to accept string array
  ) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handlePostalCodeChange = (value: string) => {
    if (/^\d{0,4}$/.test(value)) {
      setFilters((prev) => ({ ...prev, postalCode: value }));
    }
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const handleRefreshData = () => {
    localStorage.removeItem(CACHE_KEY);
    setTournaments([]);
    setFrom(0);
    setHasMore(true);
    fetchTournamentsData(0, true);
  };

  const handleLoadMore = () => {
    if (!loading.more && hasMore) {
      fetchTournamentsData(from);
    }
  };

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      if (
        filters.location &&
        !t.Address?.toLowerCase().includes(filters.location.toLowerCase())
      )
        return false;
      // Updated region filter logic for array
      if (
        filters.region.length > 0 && // Check if there are any regions selected
        !filters.region.includes("Alle") && // If "Alle" is not selected
        !filters.region.includes(getRegionFromAddress(t.Address || "")) // Check if tournament region is in selected regions
      )
        return false;
      if (
        filters.postalCode &&
        getPostalCodeFromAddress(t.Address || "") !== filters.postalCode
      )
        return false;
      if (
        filters.month &&
        format(parseISO(t.StartDate), "MM") !== filters.month
      )
        return false;
      if (
        filters.class &&
        !t.Classes?.some((c) =>
          c.Name.toUpperCase().includes(filters.class.toUpperCase())
        )
      )
        return false;
      return true;
    });
  }, [filters, tournaments]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.location) count++;
    // Updated active filter count for regions
    if (
      filters.region.length > 0 &&
      !(filters.region.length === 1 && filters.region[0] === "Alle")
    )
      count++;
    if (filters.postalCode) count++;
    if (filters.month) count++;
    if (filters.class) count++;
    return count;
  }, [filters]);

  return (
    <>
      <HomeBar />
      <Animation>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-200">
          <div className="container mx-auto p-4 sm:p-6">
            <header className="pt-8 pb-10 text-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-10 blur-3xl"></div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 relative z-10">
                DPF Turneringer
              </h1>
              <p className="mt-3 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto relative z-10">
                Udforsk kommende padel-turneringer i hele Danmark. Filtrer, find
                og gør dig klar til at konkurrere!
              </p>
            </header>

            {error && (
              <AlertMessage
                type="error"
                message={error}
                onClose={() => setError(null)}
              />
            )}
            {successMessage && (
              <AlertMessage
                type="success"
                message={successMessage}
                onClose={() => setSuccessMessage(null)}
              />
            )}

            <TournamentFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onPostalCodeChange={handlePostalCodeChange}
              onClearFilters={handleClearFilters}
              onRefreshData={handleRefreshData}
              classOptions={classOptions}
              regionOptions={REGIONS}
              monthOptions={MONTHS}
              filterCount={activeFilterCount}
            />

            {loading.initial && <LoadingSpinner size="large" />}

            {!loading.initial && filteredTournaments.length === 0 && (
              <div className="text-center py-10 px-6 bg-slate-800 rounded-lg shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto h-12 w-12 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Ingen turneringer fundet
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Prøv at justere dine filtre eller indlæs flere turneringer.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center justify-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Ryd Filtre ({activeFilterCount})
                    </button>
                  )}
                  {hasMore && (
                    <button
                      onClick={handleLoadMore}
                      disabled={loading.more}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
                    >
                      {loading.more ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      )}
                      Indlæs Flere Turneringer
                    </button>
                  )}
                </div>
                {!activeFilterCount && !hasMore && (
                  <p className="mt-4 text-sm text-slate-500">
                    Der er ingen flere turneringer at vise med de nuværende
                    indstillinger.
                  </p>
                )}
              </div>
            )}

            {!loading.initial && filteredTournaments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.EventId}
                    tournament={tournament}
                  />
                ))}
              </div>
            )}

            {loading.more && <LoadingSpinner size="small" />}

            {!loading.initial &&
              !loading.more &&
              hasMore &&
              filteredTournaments.length > 0 && (
                <div className="mt-10 text-center">
                  <button
                    onClick={handleLoadMore}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg"
                  >
                    Indlæs Flere Turneringer
                  </button>
                </div>
              )}
          </div>
        </div>
      </Animation>
    </>
  );
};

export default UpcomingTournaments;
