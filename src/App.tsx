import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import CheckInPage from "./pages/checkInPage";
import PlayerPage from "./pages/PlayerPage";
import { HelmetProvider } from "react-helmet-async";
import { UserProvider } from "./context/UserContext";
import { WHITELIST_ROUTES } from "./context/WhitelistRoutes";

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <UserProvider>
          <Routes>
            {/* Whitelisted Routes - Accessible without login but still inside UserProvider */}
            {WHITELIST_ROUTES.map((path) => (
              <Route
                key={path}
                path={path}
                element={getWhitelistComponent(path)}
              />
            ))}

            {/* Protected Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

// Function to dynamically get the component for whitelisted routes
function getWhitelistComponent(path: string) {
  const whitelistComponents: Record<string, JSX.Element> = {
    "/check-in": <CheckInPage />,
    "/player/:playerId/:tournamentClassId": <PlayerPage />,
  };
  return whitelistComponents[path] || <LoginPage />; // Default fallback
}

export default App;
