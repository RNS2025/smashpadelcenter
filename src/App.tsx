import "./App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/(logged-in)/HomePage.tsx";
import AdminPage from "./pages/(logged-in)/misc/AdminPage.tsx";
import CheckInPage from "./pages/CheckInPage.tsx";
import PlayerPage from "./pages/(logged-in)/tournament/PlayerPage.tsx";
import { HelmetProvider } from "react-helmet-async";
import { UserProvider } from "./context/UserContext";
import BookCourtPage from "./pages/(logged-in)/BookingOfCourt.tsx";
import BookTrainingPage from "./pages/(logged-in)/BookTraining.tsx";
import MatchFinderPage from "./pages/(logged-in)/matchFinder/MatchFinderPage.tsx";
import RanglistePage from "./pages/(logged-in)/RanglistePage.tsx";
import NewsPage from "./pages/(logged-in)/NewsPage.tsx";
import CouponPage from "./pages/(logged-in)/CuponPage.tsx";
import LunarLigaPage from "./pages/(logged-in)/lunar/LunarLigaPage.tsx";
import PartnerPage from "./pages/(logged-in)/PartnerPage.tsx";
import ArrangementPage from "./pages/(logged-in)/ArrangementPage.tsx";
import ProfilePage from "./pages/(logged-in)/ProfilePage/ProfilePage.tsx";
import FeedbackPage from "./pages/(logged-in)/FeedbackPage.tsx";
import RegisterPage from "./pages/RegisterUserPage.tsx";
import CourtTimes from "./pages/court-times.tsx";
import TournamentTabs from "./pages/(logged-in)/tournament/TournamentTabs.tsx";
import CourtMapPage from "./pages/(logged-in)/tournament/CourtMapPage.tsx";
import TournamentsResultsPage from "./pages/(logged-in)/tournament/TournamentsResultsPage.tsx";
import LunarTeamsTab from "./components/lunar/LunarTeamsTab.tsx";
import LunarTeamsWomenTab from "./components/lunar/LunarTeamsWomenTab.tsx";
import HHTeamsTab from "./components/lunar/HHTeamsTab.tsx";
import LeagueTeamProfilePage from "./pages/(logged-in)/lunar/LeagueTeamProfilePage.tsx";
import TeamProfilePlayersTab from "./components/lunar/teamProfile/TeamProfilePlayersTab.tsx";
import TeamProfileStandingsTab from "./components/lunar/teamProfile/TeamProfileStandingsTab.tsx";
import TeamProfileMatchesTab from "./components/lunar/teamProfile/TeamProfileMatchesTab.tsx";
import TeamProfileMatchDetailsTab from "./components/lunar/teamProfile/TeamProfileMatchDetailsTab.tsx";
import CreateMatchPage from "./pages/(logged-in)/matchFinder/CreateMatchPage.tsx";
import MatchFinderAllMatchesTab from "./components/matchFinder/MatchFinderAllMatchesTab.tsx";
import MatchFinderMyMatchesTab from "./components/matchFinder/MatchFinderMyMatchesTab.tsx";
import MatchFinderAwaitingTab from "./components/matchFinder/MatchFinderAwaitingTab.tsx";
import ViewMatchPage from "./pages/(logged-in)/matchFinder/ViewMatchPage.tsx";
import OverviewTab from "./components/profile/tabs/OverviewTab.tsx";
import { ProfileProvider } from "./context/ProfileContext.tsx";
import MatchesTab from "./components/profile/tabs/MatchesTab.tsx";
import EditTab from "./components/profile/tabs/EditTab.tsx";

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <UserProvider>
          <Routes>
            {/* Whitelisted Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/turneringer/check-in" element={<CheckInPage />} />
            <Route
              path="/turneringer/baneoversigt"
              element={<CourtMapPage />}
            />
            <Route path="/player/:playerId/:rowId" element={<PlayerPage />} />
            <Route path="/court-times" element={<CourtTimes />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route path="/profil" element={
              <ProfileProvider>
                <ProfilePage />
              </ProfileProvider>
            }>
              <Route index element={<Navigate to="overblik" replace />} />
              <Route path="overblik" element={<OverviewTab />} />
              <Route path="rediger" element={<EditTab />} />
              <Route path="kampe" element={<MatchesTab />} />
            </Route>




            <Route path="/hjem" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/book-court" element={<BookCourtPage />} />
            <Route path="/book-training" element={<BookTrainingPage />} />

            <Route path="/makkerbørs" element={<MatchFinderPage />}>
              <Route index element={<Navigate to="allekampe" replace />} />
              <Route path="allekampe" element={<MatchFinderAllMatchesTab />} />
              <Route path="minekampe" element={<MatchFinderMyMatchesTab />} />
              <Route path="afventer" element={<MatchFinderAwaitingTab />} />
            </Route>
            <Route path="/makkerbørs/:matchId" element={<ViewMatchPage />} />
            <Route path="/makkerbørs/opretkamp" element={<CreateMatchPage />} />

            <Route path="/turneringer" element={<TournamentTabs />} />
            <Route
              path="/turneringer/resultater"
              element={<TournamentsResultsPage />}
            />

            <Route path="/holdligaer" element={<LunarLigaPage />}>
              <Route
                index
                element={<Navigate to="lunarligaherrer" replace />}
              />
              <Route path="lunarligaherrer" element={<LunarTeamsTab />} />
              <Route path="lunarliga4p" element={<LunarTeamsWomenTab />} />
              <Route path="hh-listen" element={<HHTeamsTab />} />
            </Route>

            <Route
              path="/holdligaer/:teamId"
              element={<LeagueTeamProfilePage />}
            >
              <Route index element={<Navigate to="spillere" replace />} />
              <Route path="spillere" element={<TeamProfilePlayersTab />} />
              <Route
                path="tabeloversigt"
                element={<TeamProfileStandingsTab />}
              />
              <Route path="kampe" element={<TeamProfileMatchesTab />} />
              <Route
                path="kampe/:matchId"
                element={<TeamProfileMatchDetailsTab />}
              />
            </Route>

            <Route path="/rangliste" element={<RanglistePage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/coupon" element={<CouponPage />} />
            <Route path="/partner" element={<PartnerPage />} />
            <Route path="/arrangement" element={<ArrangementPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
