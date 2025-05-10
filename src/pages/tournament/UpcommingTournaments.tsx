import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { format, parseISO, addDays, isBefore } from "date-fns";
import HomeBar from "../../components/misc/HomeBar";
import Animation from "../../components/misc/Animation";
import AlertMessage from "../../components/tournaments/check-in/AlertMessage";

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

const UpcomingTournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState({
    tournaments: true,
    loadMore: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
        if (startFrom === 0) {
          setLoading((prev) => ({ ...prev, tournaments: true }));
        } else {
          setLoading((prev) => ({ ...prev, loadMore: true }));
        }

        // Check cache first if allowed
        if (useCache && startFrom === 0) {
          const { data: cachedTournaments, nextFrom } = loadFromCache();
          if (cachedTournaments && cachedTournaments.length > 0) {
            setTournaments(cachedTournaments);
            setFrom(nextFrom);
            setLoading({ tournaments: false, loadMore: false });
            setSuccessMessage("Loaded tournaments from cache");
            setTimeout(() => setSuccessMessage(null), 3000);
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
          setSuccessMessage("Successfully fetched tournaments");
          setTimeout(() => setSuccessMessage(null), 3000);
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
        setLoading({ tournaments: false, loadMore: false });
      } catch {
        setError("Failed to fetch tournaments");
        setLoading({ tournaments: false, loadMore: false });
        setTimeout(() => setError(null), 5000);
      }
    },
    [loadFromCache, saveToCache]
  );

  // Initial fetch
  useEffect(() => {
    // Using a flag to ensure we only run this once
    const controller = new AbortController();
    fetchTournaments(0);
    return () => controller.abort();
  }, [fetchTournaments]);

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

  return (
    <>
      <HomeBar />
      <Animation>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">
            Upcoming Padel Tournaments
          </h1>

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

          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={handleRefreshData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
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

            {/* Region Buttons */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Filter by Region
              </label>
              <div className="flex flex-wrap gap-2">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => setRegionFilter(region)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                      regionFilter === region
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Other Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Filter by Location
                </label>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Enter city or address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Filter by Postal Code
                </label>
                <input
                  type="text"
                  value={postalCodeFilter}
                  onChange={(e) => handlePostalCodeChange(e.target.value)}
                  placeholder="Enter 4-digit postal code"
                  maxLength={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Filter by Month
                </label>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Filter by Class
                </label>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <div className="flex justify-between items-center mb-4">
            <div className="font-medium">
              Showing {filteredTournaments.length} tournament
              {filteredTournaments.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Tournament Cards */}
          {loading.tournaments ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-600">No tournaments match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <div
                  key={tournament.EventId}
                  className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition"
                >
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={tournament.PosterUrl}
                      alt={tournament.EventName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                    {tournament.IsStreamPlanned && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Live Stream
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {tournament.EventName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      {tournament.Address}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {format(parseISO(tournament.StartDate), "MMM d, yyyy")}
                    </p>

                    {tournament.Classes && tournament.Classes.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Classes:</p>
                        <div className="flex flex-wrap gap-1">
                          {tournament.Classes.map((c) => (
                            <span
                              key={c.Id}
                              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                            >
                              {c.Name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <a
                        href={tournament.EventUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !loading.loadMore && filteredTournaments.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Load More
              </button>
            </div>
          )}

          {/* Loading More Indicator */}
          {loading.loadMore && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Cache Info */}
          <div className="mt-8 text-center text-xs text-gray-500">
            Data is cached for 24 hours for improved performance
          </div>
        </div>
      </Animation>
    </>
  );
};

export default UpcomingTournaments;
