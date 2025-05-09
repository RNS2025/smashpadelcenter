import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { format, parseISO, addDays, isBefore } from "date-fns";

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
  Address: string;
  EventState: number;
  IsStreamPlanned: boolean;
  EventUrl: string;
  IsPremium: boolean;
  Classes?: TournamentClass[];
}

interface CachedData {
  tournaments: Tournament[];
  timestamp: string;
  from: number;
}

const CACHE_KEY = "padel_tournaments_cache";
const CACHE_DURATION_DAYS = 1;

const UpcommingTournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<string>("All");
  const [postalCodeFilter, setPostalCodeFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [from, setFrom] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Danish regions
  const regions = [
    "All",
    "Hovedstaden",
    "Sjælland",
    "Syddanmark",
    "Midtjylland",
    "Nordjylland",
  ];

  // Months for filter
  const months = [
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

  // Valid DPF class identifiers
  const validDPFClasses = [
    "DPF25",
    "DPF50",
    "DPF100",
    "DPF200",
    "DPF400",
    "DPF1000",
  ];

  // Unique classes for filter
  const classOptions = useMemo(() => {
    const classes = new Set<string>();
    tournaments.forEach((t) => {
      if (t.Classes) {
        t.Classes.forEach((c) => classes.add(c.Name));
      }
    });
    return [
      { value: "", label: "All Classes" },
      ...Array.from(classes)
        .sort()
        .map((name) => ({ value: name, label: name })),
    ];
  }, [tournaments]);

  // Map address to region (simple heuristic)
  const getRegionFromAddress = (address: string): string => {
    const lowerAddress = address.toLowerCase();
    if (
      lowerAddress.includes("copenhagen") ||
      lowerAddress.includes("frederiksberg") ||
      lowerAddress.includes("københavn")
    ) {
      return "Hovedstaden";
    }
    if (
      lowerAddress.includes("roskilde") ||
      lowerAddress.includes("næstved") ||
      lowerAddress.includes("køge")
    ) {
      return "Sjælland";
    }
    if (
      lowerAddress.includes("odense") ||
      lowerAddress.includes("esbjerg") ||
      lowerAddress.includes("kolding")
    ) {
      return "Syddanmark";
    }
    if (
      lowerAddress.includes("aarhus") ||
      lowerAddress.includes("viborg") ||
      lowerAddress.includes("skanderborg") ||
      lowerAddress.includes("horsens")
    ) {
      return "Midtjylland";
    }
    if (
      lowerAddress.includes("aalborg") ||
      lowerAddress.includes("frederikshavn") ||
      lowerAddress.includes("hjørring")
    ) {
      return "Nordjylland";
    }
    return "Unknown";
  };

  // Extract postal code from address and map to region
  const getPostalCodeInfo = (
    address: string
  ): { postalCode: string; region: string } => {
    const postalCodeMatch = address.match(/\b\d{4}\b/);
    const postalCode = postalCodeMatch ? postalCodeMatch[0] : "";
    const num = postalCode ? parseInt(postalCode) : 0;

    if (num >= 1000 && num <= 2999)
      return { postalCode, region: "Hovedstaden" };
    if (num >= 3000 && num <= 3699)
      return { postalCode, region: "Nordsjælland" };
    if (num >= 3700 && num <= 3799) return { postalCode, region: "Bornholm" };
    if (num >= 4000 && num <= 4999) return { postalCode, region: "Sjælland" };
    if (num >= 5000 && num <= 5999) return { postalCode, region: "Fyn" };
    if (num >= 6000 && num <= 6999)
      return { postalCode, region: "Sønderjylland" };
    if (num >= 7000 && num <= 7999)
      return { postalCode, region: "Nordvestjylland" };
    if (num >= 8000 && num <= 8999) return { postalCode, region: "Østjylland" };
    if (num >= 9000 && num <= 9999)
      return { postalCode, region: "Nordjylland" };
    return { postalCode, region: "Unknown" };
  };

  // Check if cache is valid
  const isCacheValid = useCallback((cachedData: CachedData): boolean => {
    const cacheDate = new Date(cachedData.timestamp);
    const expiryDate = addDays(cacheDate, CACHE_DURATION_DAYS);
    return isBefore(new Date(), expiryDate);
  }, []);

  // Save data to cache
  const saveToCache = useCallback((data: Tournament[], currentFrom: number) => {
    const cacheData: CachedData = {
      tournaments: data,
      timestamp: new Date().toISOString(),
      from: currentFrom + 25, // Store next starting point
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  }, []);

  // Load data from cache
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

      return {
        data: cachedData.tournaments,
        nextFrom: cachedData.from,
      };
    } catch (e) {
      console.error("Error loading from cache:", e);
      localStorage.removeItem(CACHE_KEY);
      return { data: null, nextFrom: 0 };
    }
  }, [isCacheValid]);

  // Fetch tournaments with caching
  const fetchTournaments = useCallback(
    async (startFrom: number, useCache: boolean = true) => {
      try {
        setLoading(true);

        // Check cache first if allowed
        if (useCache && startFrom === 0) {
          const { data: cachedTournaments, nextFrom } = loadFromCache();
          if (cachedTournaments && cachedTournaments.length > 0) {
            setTournaments(cachedTournaments);
            setFrom(nextFrom);
            setLoading(false);
            return;
          }
        }

        // Fetch from API if cache is not available or invalid
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

        // Fetch classes and address for each tournament
        const tournamentsWithClasses = await Promise.all(
          response.data.map(async (tournament: Tournament) => {
            try {
              const classResponse = await axios.get(
                `https://api.rankedin.com/v1/tournament/GetInfoAsync?id=${tournament.EventId}&language=en`
              );
              const sidebar = classResponse.data.TournamentSidebarModel;
              // Filter classes to only include valid DPF classes
              const filteredClasses = (sidebar.Classes || []).filter(
                (c: TournamentClass) =>
                  validDPFClasses.some((dpf) =>
                    c.Name.toLowerCase().includes(dpf.toLowerCase())
                  )
              );
              return {
                ...tournament,
                Address: sidebar.Address || tournament.Address, // Use event address
                Classes: filteredClasses,
              };
            } catch (classError) {
              console.error(
                `Failed to fetch classes for tournament ${tournament.EventId}:`,
                classError
              );
              return { ...tournament, Classes: [] };
            }
          })
        );

        if (startFrom === 0) {
          setTournaments(tournamentsWithClasses);
          // Save to cache only for initial load
          saveToCache(tournamentsWithClasses, startFrom);
        } else {
          setTournaments((prevTournaments) => {
            const updatedTournaments = [
              ...prevTournaments,
              ...tournamentsWithClasses,
            ];

            // Update cache with the new data if it's not too large
            if (updatedTournaments.length <= 100) {
              // Limit cache size
              saveToCache(updatedTournaments, startFrom);
            }

            return updatedTournaments;
          });
        }

        setFrom(startFrom + 25);
        setHasMore(response.data.length === 25);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch tournaments");
        setLoading(false);
      }
    },
    [loadFromCache, saveToCache]
  ); // Remove tournaments from dependency array

  // Initial fetch
  useEffect(() => {
    // Using a flag to ensure we only run this once
    const controller = new AbortController();
    fetchTournaments(0);
    return () => controller.abort();
  }, []);

  // Apply filters with useMemo for optimization
  const filteredTournaments = useMemo(() => {
    let filtered = tournaments;

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter((t) =>
        t.Address.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Region filter
    if (regionFilter !== "All") {
      filtered = filtered.filter(
        (t) => getRegionFromAddress(t.Address) === regionFilter
      );
    }

    // Postal code filter
    if (postalCodeFilter) {
      filtered = filtered.filter((t) => {
        const { postalCode } = getPostalCodeInfo(t.Address);
        return postalCode === postalCodeFilter;
      });
    }

    // Month filter
    if (monthFilter) {
      filtered = filtered.filter(
        (t) => format(parseISO(t.StartDate), "MM") === monthFilter
      );
    }

    // Class filter
    if (classFilter) {
      filtered = filtered.filter((t) =>
        t.Classes?.some((c) => c.Name === classFilter)
      );
    }

    return filtered;
  }, [
    locationFilter,
    regionFilter,
    postalCodeFilter,
    monthFilter,
    classFilter,
    tournaments,
  ]);

  // Validate postal code input
  const handlePostalCodeChange = (value: string) => {
    if (/^\d{0,4}$/.test(value)) {
      setPostalCodeFilter(value);
    }
  };

  // Load more tournaments
  const handleLoadMore = () => {
    fetchTournaments(from);
  };

  // Force refresh all data
  const handleRefreshData = () => {
    localStorage.removeItem(CACHE_KEY);
    setTournaments([]);
    setFrom(0);
    fetchTournaments(0, false);
  };

  if (error) {
    return <div className="text-black text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-black">
        Upcoming Padel Tournaments
      </h1>

      {/* Refresh button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleRefreshData}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        {/* Region Buttons */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-black mb-2">
            Filter by Region
          </label>
          <div className="flex flex-wrap gap-2">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setRegionFilter(region)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  regionFilter === region
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Date, Location, Postal Code, Month, and Class Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-black">
              Filter by Location
            </label>
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Enter city or address"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-black">
              Filter by Postal Code
            </label>
            <input
              type="text"
              value={postalCodeFilter}
              onChange={(e) => handlePostalCodeChange(e.target.value)}
              placeholder="Enter 4-digit postal code"
              maxLength={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-black">
              Filter by Month
            </label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-black">
              Filter by Class
            </label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
            >
              {classOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tournament Count */}
      <div className="mb-4 text-black">
        Showing {filteredTournaments.length} tournament
        {filteredTournaments.length !== 1 ? "s" : ""}
      </div>

      {/* Tournament List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTournaments.map((tournament) => (
          <div
            key={tournament.EventId}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <img
              src={tournament.PosterUrl}
              alt={tournament.EventName}
              className="w-full h-48 object-cover rounded-md mb-2"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/150";
              }}
            />
            <h2 className="text-xl font-semibold text-black">
              {tournament.EventName}
            </h2>
            <p className="text-black">{tournament.Address}</p>
            <p className="text-black">
              {format(parseISO(tournament.StartDate), "MMM d, yyyy")}
            </p>
            <p className="text-black">{tournament.OrganisationName}</p>
            {tournament.Classes && tournament.Classes.length > 0 && (
              <p className="text-black">
                Classes: {tournament.Classes.map((c) => c.Name).join(", ")}
              </p>
            )}
            {tournament.IsStreamPlanned && (
              <p className="text-green-600 font-medium">Streaming Planned</p>
            )}
            <a
              href={tournament.EventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              View Tournament
            </a>
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center my-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Load 25 More Tournaments
          </button>
        </div>
      )}

      {/* Cache Status */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Data is cached for 24 hours to improve performance
        {tournaments.length > 0 && (
          <span>
            {" "}
            · Showing {tournaments.length} total tournaments in memory
          </span>
        )}
      </div>
    </div>
  );
};

export default UpcommingTournaments;
