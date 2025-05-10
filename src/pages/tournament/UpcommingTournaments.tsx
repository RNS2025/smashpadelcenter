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
  "All",
  "Hovedstaden",
  "Sjælland",
  "Syddanmark",
  "Midtjylland",
  "Nordjylland",
];

const MONTHS = [
  { value: "", label: "All Months" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
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
  if (!address) return "Unknown";
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
  return "Unknown";
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
          title={tournament.Address || "Address not specified"}
        >
          <span role="img" aria-label="Location pin">
            📍
          </span>{" "}
          {tournament.Address || "Address not specified"}
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
              Available Classes:
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
                  +{tournament.Classes.length - 3} more
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
            View Details
          </a>
        </div>
      </div>
    </div>
  );
};

interface TournamentFiltersProps {
  filters: {
    location: string;
    region: string;
    postalCode: string;
    month: string;
    class: string;
  };
  onFilterChange: (
    filterName: keyof TournamentFiltersProps["filters"],
    value: string
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
            {filterCount > 0
              ? `Filters Applied (${filterCount})`
              : "Show Filters"}
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
                  onClick={() => {
                    onFilterChange("region", region);
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 focus:ring-offset-slate-700 ${
                    filters.region === region
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
                Location (City/Address)
              </label>
              <input
                id="locationFilter"
                type="text"
                value={filters.location}
                onChange={(e) => onFilterChange("location", e.target.value)}
                placeholder="e.g. Copenhagen"
                className="w-full px-3 py-2 border border-slate-500 bg-slate-800 text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="postalCodeFilter"
                className="block text-sm font-medium mb-1 text-gray-300"
              >
                Postal Code
              </label>
              <input
                id="postalCodeFilter"
                type="text"
                value={filters.postalCode}
                onChange={(e) => onPostalCodeChange(e.target.value)}
                placeholder="e.g. 2300"
                maxLength={4}
                className="w-full px-3 py-2 border border-slate-500 bg-slate-800 text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="monthFilter"
                className="block text-sm font-medium mb-1 text-gray-300"
              >
                Month
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
                DPF Class
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
              title="Clear all filters"
            >
              Clear Filters
            </button>
            <button
              onClick={() => {
                onRefreshData();
                setIsDropdownOpen(false);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition flex items-center justify-center text-sm"
              title="Refresh data from server"
            >
              <RefreshIcon />
              Refresh Data
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
    region: "All",
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
      { value: "", label: "All Classes" },
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
          setSuccessMessage("Loaded tournaments from cache.");
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
                sidebar.Address || eventData.Address;
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
                Address: eventData.Address || "N/A",
                Classes: [],
              };
            }
          })
        );

        const newTournaments =
          isRefresh || startFrom === 0
            ? tournamentsWithDetails
            : [...tournaments, ...tournamentsWithDetails];

        setTournaments(newTournaments);

        const nextFetchFrom = startFrom + tournamentsWithDetails.length;
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
          setSuccessMessage("Successfully fetched tournaments.");
        }
        if (isRefresh) setSuccessMessage("Data refreshed successfully.");
        setTimeout(() => setSuccessMessage(null), 2000);
      } catch (err) {
        console.error("Failed to fetch tournaments:", err);
        setError(
          "Failed to fetch tournaments. Please check your connection or try again later."
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
    value: string
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
      if (
        filters.region !== "All" &&
        getRegionFromAddress(t.Address || "") !== filters.region
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
    if (filters.region !== "All") count++;
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
                Discover upcoming Padel tournaments across Denmark. Filter,
                find, and get ready to compete!
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

            <div className="flex justify-between items-center mb-4 text-sm text-slate-400">
              <span>
                Showing{" "}
                <span className="font-semibold text-slate-200">
                  {filteredTournaments.length}
                </span>{" "}
                tournament{filteredTournaments.length !== 1 ? "s" : ""}
                {activeFilterCount > 0 &&
                  ` (out of ${tournaments.length} loaded)`}
              </span>
            </div>

            {loading.initial ? (
              <LoadingSpinner size="large" />
            ) : filteredTournaments.length === 0 ? (
              <div className="bg-slate-800 shadow-xl rounded-lg p-8 text-center text-slate-400">
                <h3 className="text-xl font-semibold mb-2 text-slate-200">
                  No Tournaments Found
                </h3>
                <p>
                  {tournaments.length > 0 && activeFilterCount > 0
                    ? "No tournaments match your current filters. Try adjusting or clearing them."
                    : "There are no upcoming tournaments at the moment. Please check back later or refresh the data."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.EventId}
                    tournament={tournament}
                  />
                ))}
              </div>
            )}

            {hasMore &&
              !loading.initial &&
              !loading.more &&
              (filteredTournaments.length > 0 || activeFilterCount === 0) && ( // Show load more if there are results OR no filters are active
                <div className="mt-10 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading.more}
                    className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Load More Tournaments
                  </button>
                </div>
              )}
            {loading.more && <LoadingSpinner size="small" />}

            <footer className="mt-12 py-6 text-center text-xs text-slate-500 border-t border-slate-700">
              Tournament data is cached for up to {CACHE_DURATION_DAYS * 24}{" "}
              hours for improved performance. Use the "Refresh" button in
              filters for the latest data.
            </footer>
          </div>
        </div>
      </Animation>
    </>
  );
};

export default UpcomingTournaments;
