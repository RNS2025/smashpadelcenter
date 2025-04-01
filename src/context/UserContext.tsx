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
      setRole(null); // Ensure role is cleared on failure

      // Only redirect if the route is NOT whitelisted
      if (!WHITELIST_ROUTES.includes(location.pathname)) {
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
  }, []);

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
