import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import { HelmetProvider } from "react-helmet-async";
import { UserProvider } from "./context/UserContext";
import RankedInTestPage from "./pages/rankedinTESTPAGE";

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        {/* Tournament check-in route outside of UserProvider */}
        <Routes>
          <Route path="/check-in" element={<RankedInTestPage />} />
        </Routes>
        <Routes>
          {/* Protected routes inside UserProvider */}
          <Route
            path="/*"
            element={
              <UserProvider>
                <Routes>
                  <Route index path="/" element={<LoginPage />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </UserProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
