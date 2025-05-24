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
import { notificationService } from "../services/notificationsService";

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  refreshUser: (forceRefresh?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const AUTH_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const USER_CACHE_KEY = "userData";
const AUTH_TIMESTAMP_KEY = "lastAuthCheck";

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
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Default to false
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const authCheckCompleted = useRef(false);
  const navigationInProgress = useRef(false);
  const fetchInProgress = useRef(false);
  const lastAuthCheck = useRef<number>(0);

  const validationTimeout = useRef<NodeJS.Timeout>();
  const maxValidationTime = 5000;

  const fetchUserData = useCallback(
    async (setLoadingState = false, forceRefresh = false): Promise<boolean> => {
      if (fetchInProgress.current) return isAuthenticated;
      fetchInProgress.current = true;

      const now = Date.now();
      const timeSinceLastCheck = now - lastAuthCheck.current;

      if (!forceRefresh && timeSinceLastCheck < AUTH_CACHE_DURATION) {
        console.debug(
          `Using cached auth data (${timeSinceLastCheck}ms since last check)`
        );
        fetchInProgress.current = false;
        return isAuthenticated;
      }

      try {
        if (setLoadingState) setLoading(true);

        lastAuthCheck.current = now;
        localStorage.setItem(AUTH_TIMESTAMP_KEY, now.toString());

        const validationPromise = new Promise<boolean>((resolve) => {
          validationTimeout.current = setTimeout(
            () => resolve(false),
            maxValidationTime
          );
        });

        const cacheBuster = `?_=${now}`;
        const response = await Promise.race([
          api.get(`/auth/check${cacheBuster}`, { withCredentials: true }),
          validationPromise,
        ]);

        if (response?.data?.isAuthenticated) {
          clearTimeout(validationTimeout.current);
          const userData = response.data.user;

          const cacheData = { user: userData, timestamp: now };
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
        if (setLoadingState) setLoading(false);
        fetchInProgress.current = false;
      }
    },
    [isAuthenticated]
  );

  // Initial authentication check on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedCacheData = localStorage.getItem(USER_CACHE_KEY);
      const storedTimestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);

      if (storedCacheData && storedTimestamp) {
        const parsedCache = JSON.parse(storedCacheData);
        const timestamp = parseInt(storedTimestamp, 10);
        const now = Date.now();

        if (now - timestamp < AUTH_CACHE_DURATION) {
          if (isMounted) {
            setUser(parsedCache.user);
            setIsAuthenticated(true);
            lastAuthCheck.current = timestamp;
            authCheckCompleted.current = true;
          }

          // Background refresh after a delay
          setTimeout(() => {
            if (isMounted) fetchUserData(false, false).catch(console.error);
          }, 500);

          return;
        }
      }

      // No valid cache, fetch user data without loading state
      await fetchUserData(false, true);
    };

    if (!authCheckCompleted.current) {
      initAuth();
    }

    return () => {
      isMounted = false;
    };
  }, [fetchUserData]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (
      !authCheckCompleted.current ||
      navigationInProgress.current ||
      loading ||
      loggingOut // Prevent navigation during logout
    ) {
      return;
    }

    const currentPath = location.pathname;

    if (isAuthenticated && currentPath === "/" && !loggingOut) {
      navigationInProgress.current = true;
      navigate("/hjem", { replace: true });
      navigationInProgress.current = false;
      return;
    }

    if (
      !isAuthenticated &&
      !isPublicRoute(currentPath) &&
      !isRouteWhitelisted(currentPath, WHITELIST_ROUTES) &&
      !fetchInProgress.current &&
      currentPath !== "/"
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

    if (currentPath === "/") {
      setError(null);
    }
  }, [isAuthenticated, location.pathname, loading, navigate, loggingOut]);

  const fetchUser = async () => {
    await fetchUserData(true, true); // Force loading state on explicit fetch
  };

  const refreshUser = async (forceRefresh = false) => {
    try {
      const now = Date.now();
      const timeSinceLastCheck = now - lastAuthCheck.current;

      if (!forceRefresh && timeSinceLastCheck < AUTH_CACHE_DURATION) {
        console.debug(
          `Skipping refresh (${timeSinceLastCheck}ms since last check)`
        );
        return;
      }

      await fetchUserData(false, forceRefresh);
    } catch (error) {
      console.error("Error refreshing user", error);
    }
  };

  const logout = async () => {
    try {
      setLoggingOut(true);
      navigationInProgress.current = true;

      try {
        await api.post("/logout", {}, { withCredentials: true });
      } catch (err) {
        console.error("API logout error:", err);
      }

      // Unsubscribe from push notifications for this device
      try {
        await notificationService.unsubscribeFromPushNotifications();
      } catch (err) {
        console.error("Push notification unsubscription error:", err);
      }

      localStorage.clear();
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      localStorage.removeItem("token");

      sessionStorage.clear();

      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);

      lastAuthCheck.current = 0;
      authCheckCompleted.current = false;
      clearTimeout(validationTimeout.current);

      navigate("/", { replace: true });
      // Immediately stop further state updates after navigation to prevent flicker
      setLoggingOut(false);
      navigationInProgress.current = false;
      return;
    } catch (error) {
      console.error("Error during logout:", error);
      setError("Fejl ved udlogning. Prøv igen.");
      navigationInProgress.current = false;
      setLoggingOut(false);
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
