import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  getUserRole,
  getUsername,
  logout as authLogout,
} from "../services/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { WHITELIST_ROUTES } from "./WhitelistRoutes";
import UserContextType from "../types/UserContextType";

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

// Add a function to check if current path is login page
const isLoginPage = (pathname: string): boolean => {
  return pathname === "/" || pathname === "/login";
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  // Use ref instead of state to track loading
  const isLoadingRef = useRef(false);
  // Add a ref to track if logout was performed
  const isLogoutRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the actual API call to a separate function
  const fetchUserData = async (currentPath: string) => {
    // Skip if already loading
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      const data = await getUserRole();
      setRole(data.role);
      const user = await getUsername();
      setUsername(user.username);
      setError(null);
      // Reset logout flag if login was successful
      isLogoutRef.current = false;
    } catch {
      setRole(null);

      // Only redirect if the route is NOT whitelisted AND not in logout process
      if (
        !isRouteWhitelisted(currentPath, WHITELIST_ROUTES) &&
        !isLogoutRef.current
      ) {
        // Only set error message if not on login page
        if (!isLoginPage(currentPath)) {
          setError("Adgang nægtet - Log ind for at se denne side");
        } else {
          setError(null); // Clear error if on login page
        }

        // Still navigate but avoid showing message when already on login page
        if (!isLoginPage(currentPath)) {
          navigate("/", {
            state: {
              message: "Log venligst ind for at få adgang til denne side",
            },
          });
        }
      }
    } finally {
      isLoadingRef.current = false;
    }
  };

  // This function is for the context API
  const fetchRole = async () => {
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
      // Set logout flag before performing logout
      isLogoutRef.current = true;
      // Clear error message immediately
      setError(null);

      await authLogout();
      setRole(null);
      setUsername(null);

      // Navigate without state to prevent message
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during logout", error);
    }
  };

  // Update error state when path changes to handle login page specially
  useEffect(() => {
    if (isLoginPage(location.pathname)) {
      setError(null); // Clear error message on login page
    }
  }, [location.pathname]);

  // Remove fetchRole from dependencies, only react to pathname changes
  useEffect(() => {
    // Skip API call right after logout
    if (isLogoutRef.current) {
      return;
    }

    // We only want this to run when the path changes
    fetchUserData(location.pathname);

    // Cleanup function to potentially cancel pending requests
    return () => {
      // If you have a way to cancel requests, you could do it here
    };
  }, [location.pathname]);

  return (
    <UserContext.Provider
      value={{
        role,
        error,
        fetchRole,
        refreshUser,
        logout,
        username,
        loading: isLoadingRef.current,
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
