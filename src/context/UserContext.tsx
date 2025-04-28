import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { logout as authLogout } from "../services/auth";
import { WHITELIST_ROUTES } from "./WhitelistRoutes";
import { User } from "../types/user";

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

const ENV = import.meta.env.MODE;
const BACKEND_URL =
  ENV === "production"
    ? "https://rnssmashapi-g6gde0fvefhchqb3.westeurope-01.azurewebsites.net"
    : "http://localhost:3001";

console.log(`UserContext using API at: ${BACKEND_URL}`);

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

  const handleUnauthenticated = useCallback(
    (currentPath: string) => {
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
    },
    [navigate]
  );

  const fetchUserData = useCallback(
    async (currentPath: string) => {
      if (isLogoutRef.current) return;
      setLoading(true);
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/v1/user-profiles/by-username/me`,
          {
            withCredentials: true,
          }
        );
        if (response.data && response.data.username) {
          setUser(response.data);
          setIsAuthenticated(true);
          setError(null);
          isLogoutRef.current = false;
          sessionStorage.setItem("isAuthenticated", "true");
          if (isLoginPage(currentPath)) {
            navigate("/hjem", { replace: true });
          }
        } else {
          return new Error("Invalid user data received");
        }
      } catch (err: any) {
        if (isLogoutRef.current) {
          console.log("Ignoring fetch error during logout");
          return;
        }
        console.error("Auth check error:", err);
        setUser(null);
        setIsAuthenticated(false);
        setError("Kunne ikke hente brugerdata.");
        sessionStorage.removeItem("isAuthenticated");
        handleUnauthenticated(currentPath);
      } finally {
        setLoading(false);
      }
    },
    [handleUnauthenticated, navigate]
  );

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
      setUser(null);
      setIsAuthenticated(false);
      sessionStorage.removeItem("isAuthenticated");
      await authLogout(); // Ensure this clears the backend session
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
      setError("Fejl ved udlogning. Prøv igen.");
    } finally {
      isLogoutRef.current = false;
    }
  };

  useEffect(() => {
    const checkInitialAuth = async () => {
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
    checkInitialAuth().then();
  }, [fetchUserData, handleUnauthenticated, location.pathname]);

  useEffect(() => {
    if (isLoginPage(location.pathname)) {
      setError(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isLogoutRef.current) return;
    if (location.key) {
      fetchUserData(location.pathname).then();
    }
  }, [fetchUserData, location.key, location.pathname]);

  useEffect(() => {
    const checkInitialAuth = async () => {
      if (isLogoutRef.current) {
        console.log("Skipping auth check during logout");
        setLoading(false);
        return;
      }
      if (
        sessionStorage.getItem("isAuthenticated") === "true" ||
        location.pathname.includes("/callback")
      ) {
        await fetchUserData(location.pathname);
      } else {
        console.log("No auth state found, setting loading false");
        setLoading(false);
        if (!isRouteWhitelisted(location.pathname, WHITELIST_ROUTES)) {
          handleUnauthenticated(location.pathname);
        }
      }
    };
    checkInitialAuth().then();
  }, [fetchUserData, handleUnauthenticated, location.pathname]);

  useEffect(() => {
    if (isLogoutRef.current) {
      console.log("Skipping fetchUserData during logout");
      return;
    }
    if (location.key) {
      fetchUserData(location.pathname).then();
    }
  }, [fetchUserData, location.key, location.pathname]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        axios
          .get(`${BACKEND_URL}/api/v1/auth/check`, { withCredentials: true })
          .catch((error) => {
            console.error("Session keep-alive failed", error);
          });
      }
    }, 30 * 60 * 1000);
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
