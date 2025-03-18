import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import { HelmetProvider } from "react-helmet-async";
import { UserProvider } from "./context/UserContext";

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <UserProvider>
          {" "}
          <Routes>
            <Route index path="/" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
