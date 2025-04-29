import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
    ? "https://smashpadelcenter-api.onrender.com"
    : "http://localhost:3001";

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
  const navigate = useNavigate();
  const location = useLocation();

  const handleUnauthenticated = useCallback(
    (currentPath: string) => {
      if (!isRouteWhitelisted(currentPath, WHITELIST_ROUTES)) {
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
      setLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/v1/auth/check`, {
          withCredentials: true,
        });
        if (response.data && response.data.isAuthenticated) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          setError(null);
          if (isLoginPage(currentPath)) {
            navigate("/hjem", { replace: true });
          }
        } else {
          throw new Error("Invalid user data received");
        }
      } catch (err: any) {
        setUser(null);
        setIsAuthenticated(false);
        setError("Kunne ikke hente brugerdata.");
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
      setError(null);
      setUser(null);
      setIsAuthenticated(false);
      await authLogout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
      setError("Fejl ved udlogning. Prøv igen.");
    }
  };

  useEffect(() => {
    fetchUserData(location.pathname).then();
  }, [fetchUserData, location.pathname]);

  useEffect(() => {
    if (isLoginPage(location.pathname)) {
      setError(null);
    }
  }, [location.pathname]);

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
