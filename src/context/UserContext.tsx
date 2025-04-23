import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { logout as authLogout } from "../services/auth";
import { WHITELIST_ROUTES } from "./WhitelistRoutes";
import User from "../types/user";

// Define the UserContextType interface if not already defined
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

// For Vite, use import.meta.env instead of process.env
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.REACT_APP_BACKEND_URL ||
  "https://localhost:3001";

const isRouteWhitelisted = (pathname: string, whitelist: string[]): boolean => {
  return whitelist.some((route) => {
    if (!route.includes(":")) return route === pathname;
    const pattern = route.replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(pathname);
  });
};

const isLoginPage = (pathname: string): boolean => {
  return pathname === "/" || pathname === "/login";
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isLogoutRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserData = async (currentPath: string) => {
    if (loading && !isLogoutRef.current) return;

    setLoading(true);

    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/auth/check`, {
        withCredentials: true,
      });

      if (response.data.isAuthenticated) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        setError(null);
        isLogoutRef.current = false;

        // Store authentication state in sessionStorage to persist across redirects
        sessionStorage.setItem("isAuthenticated", "true");

        // Redirect to /hjem if on login page
        if (isLoginPage(currentPath)) {
          navigate("/hjem", { replace: true });
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        sessionStorage.removeItem("isAuthenticated");
        handleUnauthenticated(currentPath);
      }
    } catch (err) {
      console.error("Auth check error:", err);
      setUser(null);
      setIsAuthenticated(false);
      sessionStorage.removeItem("isAuthenticated");
      handleUnauthenticated(currentPath);
    } finally {
      setLoading(false);
    }
  };

  const handleUnauthenticated = (currentPath: string) => {
    if (
      !isRouteWhitelisted(currentPath, WHITELIST_ROUTES) &&
      !isLogoutRef.current
    ) {
      if (!isLoginPage(currentPath)) {
        setError("Adgang nægtet - Log ind for at se denne side");
        navigate("/", {
          state: {
            message: "Log venligst ind for at få adgang til denne side",
            from: currentPath,
          },
          replace: true,
        });
      } else {
        setError(null);
      }
    }
  };

  const fetchUser = async () => {
    await fetchUserData(location.pathname);
  };

  const refreshUser = async () => {
    try {
      await fetchUserData(location.pathname);
    } catch (error) {
      console.error("Error refreshing user", error);
    }
  };

  const logout = async () => {
    try {
      isLogoutRef.current = true;
      setError(null);
      await authLogout();
      setUser(null);
      setIsAuthenticated(false);
      sessionStorage.removeItem("isAuthenticated");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during logout", error);
    } finally {
      isLogoutRef.current = false;
    }
  };

  // Initial authentication check
  useEffect(() => {
    const checkInitialAuth = async () => {
      // If we have a saved auth state or we're on an OAuth callback route
      if (
        sessionStorage.getItem("isAuthenticated") === "true" ||
        location.pathname.includes("/callback")
      ) {
        await fetchUserData(location.pathname);
      } else {
        setLoading(false);
        if (!isRouteWhitelisted(location.pathname, WHITELIST_ROUTES)) {
          handleUnauthenticated(location.pathname);
        }
      }
    };

    checkInitialAuth();
  }, []);

  // Clear error on login page
  useEffect(() => {
    if (isLoginPage(location.pathname)) {
      setError(null);
    }
  }, [location.pathname]);

  // Fetch user data on path change
  useEffect(() => {
    if (isLogoutRef.current) return;

    // Don't fetch on initial render as this is handled by checkInitialAuth
    if (location.key) {
      fetchUserData(location.pathname);
    }
  }, [location.pathname]);

  // Session keep-alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        axios
          .get(`${BACKEND_URL}/api/v1/auth/check`, {
            withCredentials: true,
          })
          .catch((error) => {
            console.error("Session keep-alive failed", error);
          });
      }
    }, 30 * 60 * 1000); // Ping every 30 minutes
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
