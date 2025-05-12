import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { WHITELIST_ROUTES } from "./WhitelistRoutes";
import { User } from "../types/user";
import api from "../api/api.ts";

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Cache control constants
const AUTH_CACHE_DURATION = 30000; // 30 seconds between auth checks
const USER_CACHE_KEY = "userData";
const AUTH_TIMESTAMP_KEY = "lastAuthCheck";

// Improved route matching with memoization
const isRouteWhitelisted = (pathname: string, whitelist: string[]): boolean => {
  return whitelist.some((route) => {
    if (!route.includes(":")) return route === pathname;
    const pattern = route.replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(pathname);
  });
};

const isPublicRoute = (pathname: string): boolean => {
  return (
    pathname === "/" ||
    pathname === "/register" ||
    pathname.startsWith("/turneringer")
  );
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const navigate = useNavigate();
  const location = useLocation();

  // Refs to prevent race conditions
  const authCheckCompleted = useRef(false);
  const navigationInProgress = useRef(false);
  const fetchInProgress = useRef(false);
  const lastAuthCheck = useRef<number>(0);

  // Add new validation state
  const validationTimeout = useRef<NodeJS.Timeout>();
  const maxValidationTime = 5000; // 5 seconds maximum wait time

  // Track route changes
  const routeKey = useRef(location.pathname);
  const refreshOnRouteChange = useRef(true);

  // Core function to fetch user data - doesn't handle navigation
  const fetchUserData = useCallback(
    async (
      skipLoadingState = false,
      forceRefresh = false
    ): Promise<boolean> => {
      // Skip if fetch is already in progress
      if (fetchInProgress.current) return false;

      // Check if we can use cached auth data
      const now = Date.now();
      const timeSinceLastCheck = now - lastAuthCheck.current;

      if (!forceRefresh && timeSinceLastCheck < AUTH_CACHE_DURATION) {
        console.debug(
          `Using cached auth data (${timeSinceLastCheck}ms since last check)`
        );
        return isAuthenticated;
      }

      try {
        fetchInProgress.current = true;
        if (!skipLoadingState) setLoading(true);

        // Update last check timestamp before making the request
        lastAuthCheck.current = now;
        localStorage.setItem(AUTH_TIMESTAMP_KEY, now.toString());

        // Start validation timeout
        const validationPromise = new Promise<boolean>((resolve) => {
          validationTimeout.current = setTimeout(() => {
            resolve(false);
          }, maxValidationTime);
        });

        // Race between actual fetch and timeout - use URL parameter to bust cache
        const cacheBuster = `?_=${now}`;
        const response = await Promise.race([
          api.get(`/auth/check${cacheBuster}`, {
            withCredentials: true,
          }),
          validationPromise,
        ]);

        if (response?.data?.isAuthenticated) {
          clearTimeout(validationTimeout.current);
          const userData = response.data.user;

          // Store with timestamp for cache validation
          const cacheData = {
            user: userData,
            timestamp: now,
          };

          await Promise.all([
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cacheData)),
            setUser(userData),
            setIsAuthenticated(true),
            setError(null),
          ]);

          return true;
        } else {
          throw new Error("Invalid user data received");
        }
      } catch (err: any) {
        clearTimeout(validationTimeout.current);

        await Promise.all([
          localStorage.removeItem(USER_CACHE_KEY),
          localStorage.removeItem("token"),
          setUser(null),
          setIsAuthenticated(false),
          setError("Kunne ikke validere login."),
        ]);

        return false;
      } finally {
        if (!skipLoadingState) setLoading(false);
        fetchInProgress.current = false;
      }
    },
    [isAuthenticated]
  );

  // Initial authentication check - runs on mount and key route changes
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // Skip if we're already authenticating
      if (fetchInProgress.current) return;

      setLoading(true);

      try {
        // First try to use cached user data for instant authentication
        const storedCacheData = localStorage.getItem(USER_CACHE_KEY);
        const storedTimestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);

        // Parse cached data if available
        if (storedCacheData && storedTimestamp) {
          const parsedCache = JSON.parse(storedCacheData);
          const timestamp = parseInt(storedTimestamp, 10);
          const now = Date.now();

          if (now - timestamp < AUTH_CACHE_DURATION) {
            // Cache is still valid
            lastAuthCheck.current = timestamp;
            if (isMounted) {
              setUser(parsedCache.user);
              setIsAuthenticated(true);
            }

            // Perform background refresh after a short delay
            setTimeout(() => {
              if (isMounted && refreshOnRouteChange.current) {
                fetchUserData(true, false).catch(console.error);
              }
            }, 500);

            if (isMounted) {
              setLoading(false);
              authCheckCompleted.current = true;
            }
            return;
          }
        }

        // No valid cache, do a fresh fetch
        await fetchUserData(false, true);
      } finally {
        if (isMounted) {
          setLoading(false);
          authCheckCompleted.current = true;
        }
      }
    };

    // If route changed significantly, run auth check again
    if (routeKey.current !== location.pathname) {
      routeKey.current = location.pathname;
      refreshOnRouteChange.current = true;
      authCheckCompleted.current = false;
      initAuth();
    } else if (!authCheckCompleted.current) {
      // On initial mount or after manual reset
      initAuth();
    }

    return () => {
      isMounted = false;
    };
  }, [fetchUserData, location.pathname]);

  // Handle navigation based on auth state and current route
  useEffect(() => {
    if (
      !authCheckCompleted.current ||
      navigationInProgress.current ||
      loading
    ) {
      return;
    }

    const currentPath = location.pathname;

    // Handle authenticated users on login page
    if (isAuthenticated && currentPath === "/") {
      navigationInProgress.current = true;
      navigate("/hjem", { replace: true });
      navigationInProgress.current = false;
      return;
    }

    // Protected route access check - no delay, direct navigation
    if (
      !isAuthenticated &&
      !isPublicRoute(currentPath) &&
      !isRouteWhitelisted(currentPath, WHITELIST_ROUTES) &&
      !fetchInProgress.current // Important: don't redirect if still fetching
    ) {
      navigationInProgress.current = true;
      setError("Adgang nægtet - Log ind for at se denne side");
      navigate("/", {
        state: {
          message: "Log venligst ind for at få adgang til denne side",
          from: currentPath,
        },
        replace: true,
      });
      navigationInProgress.current = false;
    }

    // Clear errors when on login page
    if (currentPath === "/") {
      setError(null);
    }
  }, [isAuthenticated, location.pathname, loading, navigate]);

  // Public methods
  const fetchUser = async () => {
    refreshOnRouteChange.current = true;
    await fetchUserData(false, true);
  };

  // Lightweight refresh that doesn't trigger loading state and respects cache
  const refreshUser = async () => {
    try {
      // Check cache timing first
      const now = Date.now();
      const timeSinceLastCheck = now - lastAuthCheck.current;

      if (timeSinceLastCheck < AUTH_CACHE_DURATION) {
        console.debug(
          `Skipping refresh (${timeSinceLastCheck}ms since last check)`
        );
        return;
      }

      await fetchUserData(true, false);
    } catch (error) {
      console.error("Error refreshing user", error);
    }
  };

  const logout = async () => {
    try {
      // Set flags to prevent navigation during logout
      navigationInProgress.current = true;

      // Call API logout first - include credentials to send the cookie
      try {
        await api.post("/logout", {}, { withCredentials: true });
      } catch (err) {
        console.error("API logout error:", err);
        // Continue with local logout even if API call fails
      }

      // Then clear all local storage
      localStorage.clear();
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      localStorage.removeItem("token");

      // Clear SessionStorage
      sessionStorage.clear();

      // Clear user data and authentication state
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);

      // Reset refs
      lastAuthCheck.current = 0;
      authCheckCompleted.current = false;
      refreshOnRouteChange.current = false;
      clearTimeout(validationTimeout.current);

      // Update state
      setUser(null);
      setIsAuthenticated(false);
      setError(null);

      // Mark auth check completed to prevent auto-authentication
      authCheckCompleted.current = true;

      // Navigate to login page
      navigate("/", { replace: true });

      // Reset navigation flag
      navigationInProgress.current = false;
    } catch (error) {
      console.error("Error during logout:", error);
      setError("Fejl ved udlogning. Prøv igen.");
      navigationInProgress.current = false;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated,
        error,
        fetchUser,
        refreshUser,
        logout,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
