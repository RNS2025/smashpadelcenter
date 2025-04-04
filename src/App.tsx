import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import CheckInPage from "./pages/CheckInPage.tsx";
import PlayerPage from "./pages/PlayerPage";
import { HelmetProvider } from "react-helmet-async";
import { UserProvider } from "./context/UserContext";
import BookCourtPage from "./pages/CardBookCourtWithSelector.tsx";
import BookTrainingPage from "./pages/BookTranningCardithSelctor.tsx";
import CommunityPage from "./pages/CommunityPage.tsx";
import TournamentPage from "./pages/TournamentPage.tsx";
import RanglistePage from "./pages/RanglistePage";
import NewsPage from "./pages/NewsPage";
import CouponPage from "./pages/CuponPage.tsx";
import LunarLigaPage from "./pages/LunarLigaPage";
import PartnerPage from "./pages/PartnerPage";
import ArrangementPage from "./pages/ArrangementPage";

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
            <Route path="/book-court" element={<BookCourtPage />} />
            <Route path="/book-training" element={<BookTrainingPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/tournament" element={<TournamentPage />} />
            <Route path="/rangliste" element={<RanglistePage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/coupon" element={<CouponPage />} />
            <Route path="/lunar-liga" element={<LunarLigaPage />} />
            <Route path="/partner" element={<PartnerPage />} />
            <Route path="/arrangement" element={<ArrangementPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
