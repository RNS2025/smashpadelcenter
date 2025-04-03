import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import CheckInPage from "./pages/CheckInPage.tsx";
import PlayerPage from "./pages/PlayerPage";
import { HelmetProvider } from "react-helmet-async";
import { UserProvider } from "./context/UserContext";

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <UserProvider>
          <Routes>
            {/* Whitelisted Routes */}
            <Route path="/check-in" element={<CheckInPage />} />
            <Route path="/player/:playerId/:rowId" element={<PlayerPage />} />

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

export default App;
