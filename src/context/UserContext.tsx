import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logout as authLogout } from "../services/auth";
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
  const loggingOut = useRef(false);
  const fetchInProgress = useRef(false);

  // Core function to fetch user data - doesn't handle navigation
  const fetchUserData = useCallback(
    async (skipLoadingState = false): Promise<boolean> => {
      if (fetchInProgress.current) return false;

      try {
        fetchInProgress.current = true;
        if (!skipLoadingState) setLoading(true);

        const response = await api.get(`/auth/check`, {
          withCredentials: true,
        });

        if (response.data && response.data.isAuthenticated) {
          const userData = response.data.user;

          // Update everything in one batch to prevent race conditions
          Promise.all([
            localStorage.setItem("user", JSON.stringify(userData)),
            setUser(userData),
            setIsAuthenticated(true),
            setError(null),
          ]);

          return true;
        } else {
          throw new Error("Invalid user data received");
        }
      } catch (err: any) {
        // Clear everything in one batch
        Promise.all([
          localStorage.removeItem("user"),
          setUser(null),
          setIsAuthenticated(false),
          setError("Kunne ikke hente brugerdata."),
        ]);

        return false;
      } finally {
        if (!skipLoadingState) setLoading(false);
        fetchInProgress.current = false;
      }
    },
    []
  );

  // Initial authentication check - runs only once on mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);

      try {
        // First try to use cached user data for instant authentication
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }

        // Then verify with server (in background if we had stored user)
        await fetchUserData(!!storedUser);
      } finally {
        setLoading(false);
        authCheckCompleted.current = true;
      }
    };

    initAuth();
  }, [fetchUserData]);

  // Handle navigation based on auth state and current route
  useEffect(() => {
    // Skip if auth check not completed or navigation already in progress
    if (
      !authCheckCompleted.current ||
      navigationInProgress.current ||
      loggingOut.current ||
      loading
    ) {
      return;
    }

    const currentPath = location.pathname;

    // Handle authenticated users on login page
    if (isAuthenticated && currentPath === "/") {
      navigationInProgress.current = true;
      navigate("/hjem", { replace: true });
      setTimeout(() => {
        navigationInProgress.current = false;
      }, 100);
      return;
    }

    // Handle unauthenticated users on protected routes
    if (
      !isAuthenticated &&
      !isPublicRoute(currentPath) &&
      !isRouteWhitelisted(currentPath, WHITELIST_ROUTES)
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
      setTimeout(() => {
        navigationInProgress.current = false;
      }, 100);
      return;
    }

    // Clear errors when on login page
    if (currentPath === "/") {
      setError(null);
    }
  }, [isAuthenticated, location.pathname, loading, navigate]);

  // Public methods
  const fetchUser = async () => {
    await fetchUserData();
  };

  // Lightweight refresh that doesn't trigger loading state
  const refreshUser = async () => {
    try {
      await fetchUserData(true);
    } catch (error) {
      console.error("Error refreshing user", error);
    }
  };

  const logout = async () => {
    try {
      loggingOut.current = true;

      // Clear local data first
      localStorage.removeItem("user");
      localStorage.removeItem("userProfile");
      localStorage.removeItem("userProfile");

      // Update state pre-emptively to avoid flickering
      setError(null);
      setUser(null);
      setIsAuthenticated(false);

      // Then call API (but don't wait for it before navigation)
      authLogout().catch(console.error);

      // Navigate to home
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
      setError("Fejl ved udlogning. Prøv igen.");
    } finally {
      setTimeout(() => {
        loggingOut.current = false;
      }, 100);
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
