import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserRole, logout as authLogout } from "../services/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { WHITELIST_ROUTES } from "./WhitelistRoutes";

interface UserContextType {
  role: string | null;
  error: string | null;
  fetchRole: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Utility function to check if a path matches a route pattern
const isRouteWhitelisted = (pathname: string, whitelist: string[]): boolean => {
  return whitelist.some((route) => {
    // If it's a static route, check exact match
    if (!route.includes(":")) return route === pathname;

    // For dynamic routes, create a regex pattern
    const pattern = route
      .replace(/:[^/]+/g, "[^/]+") // Replace :param with wildcard
      .replace(/\//g, "\\/"); // Escape slashes
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(pathname);
  });
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchRole = async () => {
    try {
      const data = await getUserRole();
      setRole(data.role);
      setError(null);
    } catch (error) {
      setRole(null);

      // Only redirect if the route is NOT whitelisted
      if (!isRouteWhitelisted(location.pathname, WHITELIST_ROUTES)) {
        setError("Permission denied - Login to view this page");
        navigate("/", {
          state: { message: "Please login to access this page" },
        });
      }
    }
  };

  const refreshUser = async () => {
    try {
      await fetchRole();
    } catch (error) {
      console.error("Error refreshing user", error);
    }
  };

  const logout = async () => {
    try {
      await authLogout();
      setRole(null);
      navigate("/");
    } catch (error) {
      console.error("Error during logout", error);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [location.pathname]);

  return (
    <UserContext.Provider
      value={{ role, error, fetchRole, refreshUser, logout }}
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
