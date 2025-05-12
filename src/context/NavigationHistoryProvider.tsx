import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import NavigationHistoryContext from "./NavigationHistoryContextType";

// Provider component
const NavigationHistoryProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [history, setHistory] = useState<string[]>([]);
  const location = useLocation();

  // Add current path to history when location changes
  useEffect(() => {
    // Only add to history if it's not the same as the last entry
    if (
      history.length === 0 ||
      history[history.length - 1] !== location.pathname
    ) {
      setHistory((prev) => [...prev, location.pathname]);
    }

    // Limit history size to prevent memory issues
    if (history.length > 30) {
      setHistory((prev) => prev.slice(prev.length - 30));
    }
  }, [location.pathname, history]);

  // Clear navigation history
  const clearHistory = () => {
    setHistory([]);
  };

  // Find the closest home page in the history based on priority
  const getClosestHomePage = (): string => {
    // Special case: If we're on the home page itself, there's no "back"
    if (location.pathname === "/hjem" || location.pathname === "/") {
      return "/hjem";
    }

    //PAGES THAT SHOULD GO DIRECTLY TO HOME
    const primaryPages = [
      "/makkerbørs",
      "/makkerb%C3%B8rs/allekampe",
      "/makkerb%C3%B8rs/minekampe",
      "/makkerb%C3%B8rs/afventer",
      "/privat-arrangementer",
      "/holdligaer",
      "/turneringer",
      "/rangliste",
      "/news",
      "/partner",
      "/arrangement",
      "/admin",
      "/profil",
    ];

    // Check if current path starts with /profil
    if (location.pathname.startsWith("/profil")) {
      return "/hjem";
    }

    // If current page is a primary page, go directly to home
    if (primaryPages.includes(location.pathname)) {
      return "/hjem";
    }

    // Otherwise, simply go one level up in the URL hierarchy
    const currentPath = location.pathname.replace(/\/$/, "");
    const lastSlashIndex = currentPath.lastIndexOf("/");

    if (lastSlashIndex > 0) {
      // Go one level up
      const oneUpPath = currentPath.substring(0, lastSlashIndex);

      // If the one-level-up path is a known route (either primary or not)
      if (primaryPages.includes(oneUpPath) || oneUpPath === "/hjem") {
        return oneUpPath;
      }

      // Otherwise, try going up one more level if possible
      const secondLastSlashIndex = oneUpPath.lastIndexOf("/");
      if (secondLastSlashIndex > 0) {
        return oneUpPath.substring(0, secondLastSlashIndex);
      }

      // Special case: If the one-up path is "/hjem", return it
      if (oneUpPath === "/hjem") {
        return oneUpPath;
      }

      // If can't go up further, return the one-up path anyway
      return oneUpPath;
    }

    // Fallback to home if we can't go up (should rarely happen)
    return "/hjem";
  };

  return (
    <NavigationHistoryContext.Provider
      value={{
        history,
        getClosestHomePage,
        clearHistory,
      }}
    >
      {children}
    </NavigationHistoryContext.Provider>
  );
};

export default NavigationHistoryProvider;
