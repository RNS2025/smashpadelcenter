import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/(logged-in)/HomePage.tsx";
import AdminPage from "./pages/(logged-in)/AdminPage.tsx";
import CheckInPage from "./pages/CheckInPage.tsx";
import PlayerPage from "./pages/(logged-in)/tournament/PlayerPage.tsx";
import { HelmetProvider } from "react-helmet-async";
import { UserProvider } from "./context/UserContext";
import BookCourtPage from "./pages/(logged-in)/CardBookCourtWithSelector.tsx";
import BookTrainingPage from "./pages/(logged-in)/BookTranningCardithSelctor.tsx";
import CommunityPage from "./pages/(logged-in)/CommunityPage.tsx";
import TournamentPage from "./pages/(logged-in)/tournament/TournamentPage.tsx";
import RanglistePage from "./pages/(logged-in)/RanglistePage.tsx";
import NewsPage from "./pages/(logged-in)/NewsPage.tsx";
import CouponPage from "./pages/(logged-in)/CuponPage.tsx";
import LunarLigaPage from "./pages/(logged-in)/LunarLigaPage.tsx";
import PartnerPage from "./pages/(logged-in)/PartnerPage.tsx";
import ArrangementPage from "./pages/(logged-in)/ArrangementPage.tsx";
import ProfilePage from "./pages/(logged-in)/ProfilePage.tsx";
import CourtTimes from "./pages/court-times.tsx";

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <UserProvider>
          <Routes>
            {/* Whitelisted Routes */}
            <Route path="/check-in" element={<CheckInPage />} />
            <Route path="/player/:playerId/:rowId" element={<PlayerPage />} />
            <Route path="/court-times" element={<CourtTimes />} />

            {/* Protected Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
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
