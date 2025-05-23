import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { UserProvider } from "./context/UserContext";
import { NotificationProvider } from "./context/NotificationProvider";
import NavigationHistoryProvider from "./context/NavigationHistoryProvider";
import LoadingSpinner from "./components/misc/LoadingSpinner.tsx";
import InstallPrompt from "./components/misc/InstallPrompt.tsx";
import InstallPage from "./pages/installPage.tsx"; // New import
import LoginPage from "./pages/login/LoginPage.tsx";
import HomePage from "./pages/(logged-in)/HomePage.tsx";
import AdminPage from "./pages/(logged-in)/misc/AdminPage.tsx";
import CheckInPage from "./pages/tournament/CheckInPage.tsx";
import PlayerPage from "./pages/tournament/PlayerPage.tsx";
import MatchFinderPage from "./pages/(logged-in)/matchFinder/MatchFinderPage.tsx";
import RanglistePage from "./pages/(logged-in)/RanglistePage.tsx";
import NewsPage from "./pages/(logged-in)/NewsPage.tsx";
import CouponPage from "./pages/(logged-in)/CuponPage.tsx";
import LunarLigaPage from "./pages/(logged-in)/lunar/LunarLigaPage.tsx";
import PartnerPage from "./pages/(logged-in)/PartnerPage.tsx";
import ArrangementPage from "./pages/(logged-in)/ArrangementPage.tsx";
import FeedbackPage from "./pages/(logged-in)/misc/FeedbackPage.tsx";
import RegisterPage from "./pages/login/RegisterUserPage.tsx";
import TournamentTabs from "./pages/tournament/TournamentTabs.tsx";
import CourtMapPage from "./pages/tournament/CourtMapPage.tsx";
import TournamentsResultsPage from "./pages/tournament/TournamentsResultsPage.tsx";
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
import EditTab from "./components/profile/tabs/EditTab.tsx";
import "./App.css";
import PrivateEventPage from "./pages/(logged-in)/private-event/PrivateEventPage.tsx";
import MyEventsTab from "./components/private-event/MyEventsTab.tsx";
import CreateEventPage from "./pages/(logged-in)/private-event/CreateEventPage.tsx";
import ViewEventPage from "./pages/(logged-in)/private-event/ViewEventPage.tsx";
import AllEventsTab from "./components/private-event/AllEventsTab.tsx";
import GroupsTab from "./components/profile/tabs/groups/GroupsTab.tsx";
import CreateGroupTab from "./components/profile/tabs/groups/CreateGroupTab.tsx";
import EditGroupTab from "./components/profile/tabs/groups/EditGroupTab.tsx";
import TournamentInfoPage from "./pages/tournament/info/TournamentInfoPage.tsx";
import { TournamentRegulationsTab } from "./components/tournaments/info/TournamentRegulationsTab.tsx";
import TournamentBriefingTab from "./components/tournaments/info/TournamentBriefingTab.tsx";
import TournamentEditBriefingPage from "./pages/tournament/info/TournamentEditBriefingPage.tsx";
import ProfilePageWrapper from "./context/ProfilePageWrapper.tsx";
import { useUser } from "./context/UserContext";
import EditMatchPage from "./pages/(logged-in)/matchFinder/EditMatchPage.tsx";
import EditEventPage from "./pages/(logged-in)/private-event/EditEventPage.tsx";
import MatchResultPage from "./pages/(logged-in)/matchFinder/MatchResultPage.tsx";
import MatchesTab from "./components/profile/tabs/MatchesTab.tsx";
import ResetPasswordPage from "./pages/login/ResetPasswordPage.tsx";
import ForgotPasswordPage from "./pages/login/ForgotPasswordPage.tsx";
import UpcommingTournaments from "./pages/tournament/UpcommingTournaments.tsx";
import LeagueStandingsPage from "./pages/(logged-in)/lunar/GlobalLunarInformation.tsx";
import HomeBar from "./components/misc/HomeBar.tsx";
import EnterResultPage from "./pages/tournament/results/indtastDpfResultat.tsx";
import TournamentDrawsPage from "./pages/tournament/TournamentDrawsPage.tsx";

function AppContent() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const { isAuthenticated, loading } = useUser();
  const location = useLocation();

  useEffect(() => {
    // Check if app is already installed
    const checkInstallation = async () => {
      if ("getInstalledRelatedApps" in navigator) {
        const relatedApps = await (navigator as any).getInstalledRelatedApps();
        const isInstalled = relatedApps.some((app: any) =>
          app.url.includes(window.location.origin)
        );
        setIsAppInstalled(isInstalled);
      }

      // Check if user has dismissed the prompt recently
      const dismissedTimestamp = localStorage.getItem("pwaPromptDismissed");
      if (dismissedTimestamp) {
        const dismissedDate = new Date(parseInt(dismissedTimestamp, 10));
        const now = new Date();
        const daysSinceDismissal =
          (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissal < 7) {
          setIsPromptDismissed(true);
        }
      }
    };

    checkInstallation().then();

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Handle appinstalled event
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("pwaPromptDismissed", Date.now().toString());
    setIsPromptDismissed(true);
  };

  // Don't show prompt if app is installed, prompt is dismissed, or running in standalone mode
  const shouldShowPrompt =
    deferredPrompt &&
    !isAppInstalled &&
    !isPromptDismissed &&
    !window.matchMedia("(display-mode: standalone)").matches;

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <>
      {" "}
      {shouldShowPrompt && (
        <InstallPrompt
          deferredPrompt={deferredPrompt}
          onDismiss={handleDismiss}
        />
      )}
      {/* Only show HomeBar on non-login paths */}
      {location.pathname !== "/" && location.pathname !== "/login" && (
        <HomeBar />
      )}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/install" element={<InstallPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/turneringer" element={<TournamentTabs />} />
        <Route path="/turneringer/check-in" element={<CheckInPage />} />
        <Route path="/turneringer/baneoversigt" element={<CourtMapPage />} />
        <Route path="/turneringer/lodtrækninger" element={<TournamentDrawsPage />} />
        <Route path="/turneringer/info" element={<TournamentInfoPage />}>
          <Route index element={<Navigate to="briefing" replace />} />
          <Route path="briefing" element={<TournamentBriefingTab />} />
          <Route path="generelt" element={<TournamentRegulationsTab />} />
        </Route>
        <Route
          path="/turneringer/enter-resultat"
          element={<EnterResultPage />}
        />
        <Route
          path="/turneringer/spiller/:rankedInId"
          element={<PlayerPage />}
        />
        <Route path="/player/:rankedInId" element={<PlayerPage />} />
        <Route path="/glemt-adgangskode" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route
          path="/turneringer/kommende"
          element={<UpcommingTournaments />}
        />

        {/* Protected Routes */}
        {isAuthenticated ? (
          <>
            <Route path="/profil/:username" element={<ProfilePageWrapper />}>
              <Route index element={<Navigate to="overblik" replace />} />
              <Route path="overblik" element={<OverviewTab />} />
              <Route path="kamphistorik" element={<MatchesTab />} />
              <Route path="rediger" element={<EditTab />} />
              <Route path="grupper" element={<GroupsTab />} />
              <Route path="grupper/opretgruppe" element={<CreateGroupTab />} />
              <Route path="grupper/:groupId" element={<EditGroupTab />} />
            </Route>

            <Route path="/hjem" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* <Route path="/book-court" element={<BookCourtPage />} />
              <Route path="/book-training" element={<BookTrainingPage />} /> */}

            <Route path="/makkerbørs" element={<MatchFinderPage />}>
              <Route index element={<Navigate to="allekampe" replace />} />
              <Route path="allekampe" element={<MatchFinderAllMatchesTab />} />
              <Route path="minekampe" element={<MatchFinderMyMatchesTab />} />
              <Route path="afventer" element={<MatchFinderAwaitingTab />} />
            </Route>
            <Route
              path="/makkerbørs/match/:matchId"
              element={<ViewMatchPage />}
            />
            <Route
              path="/makkerbørs/match/opretkamp"
              element={<CreateMatchPage />}
            />
            <Route
              path="/makkerbørs/match/:matchId/indtastresultat"
              element={<MatchResultPage />}
            />
            <Route
              path="/makkerbørs/match/:matchId/rediger"
              element={<EditMatchPage />}
            />

            {/* Arrangementer */}
            <Route path="/privat-arrangementer" element={<PrivateEventPage />}>
              <Route
                index
                element={<Navigate to="minearrangementer" replace />}
              />
              <Route path="minearrangementer" element={<MyEventsTab />} />
              <Route path="allearrangementer" element={<AllEventsTab />} />
            </Route>
            <Route
              path="/privat-arrangementer/opretarrangement"
              element={<CreateEventPage />}
            />
            <Route
              path="/privat-arrangementer/:eventId"
              element={<ViewEventPage />}
            />
            <Route
              path="/privat-arrangementer/:eventId/rediger"
              element={<EditEventPage />}
            />

            <Route
              path="/turneringer/resultater"
              element={<TournamentsResultsPage />}
            />
            <Route
              path="/turneringer/info/briefing/redigerbriefing/:briefingId"
              element={<TournamentEditBriefingPage />}
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
            <Route path="/lunarGlobal" element={<LeagueStandingsPage />} />

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
            <Route path="/feedback" element={<FeedbackPage />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
      </Routes>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <UserProvider>
        <NotificationProvider>
          <NavigationHistoryProvider>
            <AppContent />
          </NavigationHistoryProvider>
        </NotificationProvider>
      </UserProvider>
    </HelmetProvider>
  );
}

export default App;
