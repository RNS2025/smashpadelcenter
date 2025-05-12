import { createContext } from "react";

// Types
interface NavigationHistoryContextType {
  history: string[];
  getClosestHomePage: () => string;
  clearHistory: () => void;
}

// Create context
const NavigationHistoryContext = createContext<
  NavigationHistoryContextType | undefined
>(undefined);

export default NavigationHistoryContext;
