import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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


const isRouteWhitelisted = (pathname: string, whitelist: string[]): boolean => {
  return whitelist.some((route) => {
    if (!route.includes(":")) return route === pathname;
    const pattern = route.replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(pathname);
  });
};

const isLoginPage = (pathname: string): boolean => {
  return pathname === "/";
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);


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
        const response = await api.get(`/auth/check`, {
          withCredentials: true,
        });
        if (response.data && response.data.isAuthenticated) {
          setUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          setIsAuthenticated(true);
          setError(null);
          if (isLoginPage(currentPath)) {
            navigate("/hjem");
          }
        } else {
          throw new Error("Invalid user data received");
        }
      } catch (err: any) {
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
        setError("Kunne ikke hente brugerdata.");
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }

    },
    [navigate]
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      setLoading(false);
      setInitialLoadComplete(true);
    } else {
      fetchUserData(location.pathname).then();
    }
  }, [fetchUserData, location.pathname]);

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
      setLoggingOut(true);
      localStorage.removeItem("user");
      localStorage.removeItem("userProfile")
      setError(null);
      setUser(null);
      setIsAuthenticated(false);
      await authLogout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
      setError("Fejl ved udlogning. Prøv igen.");
    } finally {
      setLoggingOut(false);
    }
  };


  useEffect(() => {
    if (!initialLoadComplete || loggingOut) return;

    if (!isAuthenticated) {
      handleUnauthenticated(location.pathname);
    }
  }, [isAuthenticated, location.pathname, handleUnauthenticated, initialLoadComplete, loggingOut]);



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
