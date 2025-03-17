import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserRole } from "../api/auth"; // Assuming this is your API call
import { useNavigate } from "react-router-dom";

interface UserContextType {
  role: string | null;
  error: string | null;
  fetchRole: () => Promise<void>; // Add the fetchRole function here
  refreshUser: () => Promise<void>; // Added refreshUser function here
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Function to fetch the user's role
  const fetchRole = async () => {
    try {
      const data = await getUserRole(); // Fetch the user's role from the API
      setRole(data.role);
      setError(null); // Clear any previous errors
    } catch (error) {
      setError("Permission denied - Login to view this page");
    }
  };

  // Function to refresh user data
  const refreshUser = async () => {
    try {
      await fetchRole(); // Simply call fetchRole to refresh user data
    } catch (error) {
      console.error("Error refreshing user", error);
    }
  };

  // Handle logout
  const logout = async () => {
    try {
      // Add your logout logic here (e.g., calling your logout API)
      await fetch("/api/v1/logout", { method: "POST", credentials: "include" });
      setRole(null); // Reset the role after logout
      navigate("/"); // Redirect to login page after logout
    } catch (error) {
      console.error("Error during logout", error);
    }
  };

  useEffect(() => {
    fetchRole(); // Call the function to fetch the role initially
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
