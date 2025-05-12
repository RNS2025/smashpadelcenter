import { useContext } from "react";
import NavigationHistoryContext from "./NavigationHistoryContextType";

// Custom hook for accessing the context
export const useNavigationHistory = () => {
  const context = useContext(NavigationHistoryContext);
  if (context === undefined) {
    throw new Error(
      "useNavigationHistory must be used within a NavigationHistoryProvider"
    );
  }
  return context;
};
