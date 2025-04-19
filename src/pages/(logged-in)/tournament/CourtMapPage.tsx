import { Helmet } from "react-helmet-async";
import CourtsMap from "../../../components/tournaments/map/CourtsMap.tsx";
import Animation from "../../../components/misc/Animation.tsx";
import { useEffect, useState } from "react";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import rankedInService from "../../../services/rankedIn.ts";
import LoadingSpinner from "../../../components/misc/LoadingSpinner.tsx";
import DpfMatch from "../../../types/DpfMatch.ts";

export const CourtMapPage = () => {
  const [selectedCourtLabel, setSelectedCourtLabel] = useState<string | null>(
    null
  );
  const [upcomingTournamentEventId, setUpcomingTournamentEventId] = useState<
    string | null
  >(null);
  const [ongoingMatch, setOnGoingMatch] = useState<DpfMatch | null>(null);
  const [upcomingMatch, setUpcommingMatch] = useState<DpfMatch | null>(null);
  const [loadingTournament, setLoadingTournament] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch upcoming tournament on component mount
  useEffect(() => {
    const fetchUpcomingTournament = async () => {
      try {
        const tournaments = await rankedInService.getAvailableTournaments();
        if (!tournaments || tournaments.length === 0) {
          console.error("No upcoming tournaments found");
          setError("Ingen kommende turneringer fundet.");
          setLoadingTournament(false);
          return;
        }

        // Extract the first number between slashes from the URL
        const matches = tournaments[0].eventUrl.match(/\/(\d+)\//);
        const eventId = matches && matches[1] ? matches[1] : null;
        if (!eventId) {
          console.error(
            "Event ID not found in tournament URL:",
            tournaments[0].eventUrl
          );
          setError("Turneringens eventId ikke fundet.");
          setLoadingTournament(false);
          return;
        }

        setUpcomingTournamentEventId(eventId);
        console.log("Upcoming tournament fetched, eventId:", eventId);
        setLoadingTournament(false);
      } catch (err) {
        console.error("Error fetching upcoming tournament:", err);
        setError("Kunne ikke indlæse turneringsdata.");
        setLoadingTournament(false);
      }
    };

    fetchUpcomingTournament();
  }, []);

  // Fetch matches when a court is selected
  useEffect(() => {
    const fetchMatchesForCourt = async () => {
      if (!selectedCourtLabel || !upcomingTournamentEventId) return;

      try {
        setLoadingMatches(true);
        setError(null);
        setOnGoingMatch(null); // Reset previous match data
        setUpcommingMatch(null); // Reset previous match data

        const { ongoingMatch, upcomingMatch } =
          await rankedInService.getOnGoingMatchAndUpcommingMatch(
            selectedCourtLabel
          );

        console.log("Fetched matches for court:", ongoingMatch, upcomingMatch);
        setOnGoingMatch(ongoingMatch);
        setUpcommingMatch(upcomingMatch);
        setLoadingMatches(false);
      } catch (err) {
        console.error(
          `Error fetching matches for court ${selectedCourtLabel}:`,
          err
        );
        setError(`Kunne ikke indlæse kampe for ${selectedCourtLabel}`);
        setLoadingMatches(false);
      }
    };

    fetchMatchesForCourt();
  }, [selectedCourtLabel, upcomingTournamentEventId]);

  const renderMatchInfo = (match: DpfMatch | null, title: string) => {
    if (!match) return null;

    return (
      <div className="rounded-lg p-2">
        <p className="font-semibold max-sm:text-sm">{title}</p>
        <div className="flex flex-col border border-black rounded-xl items-center mt-1 gap-2">
          <p className="font-semibold max-sm:text-sm">
            {match.Date
              ? new Date(match.Date).toLocaleTimeString("da-DK", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "TBD"}
          </p>
          <div className="flex max-sm:flex-col max-sm:items-center gap-2 font-semibold max-sm:text-sm">
            <p>
              {match.Challenger?.Name || "TBD"}
              {match.Challenger?.Player2Name &&
                ` / ${match.Challenger.Player2Name}`}
            </p>
            <p>vs</p>
            <p>
              {match.Challenged?.Name || "TBD"}
              {match.Challenged?.Player2Name &&
                ` / ${match.Challenged.Player2Name}`}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <HomeBar />
      <Helmet>
        <title>Baneoversigt</title>
      </Helmet>

      <Animation>
        <div className="mt-5 flex max-lg:flex-col sm:space-y-10 space-y-0 lg:justify-between lg:px-10 max-lg:px-5">
          <div className="bg-white text-black rounded-xl lg:w-2/5 h-fit p-4">
            <p className="font-semibold max-sm:text-sm">
              {selectedCourtLabel ?? "Vælg en bane"}
            </p>

            {loadingTournament ? (
              <div className="rounded-lg p-2">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <p className="text-red-500 text-center py-4">{error}</p>
            ) : selectedCourtLabel ? (
              <>
                {loadingMatches ? (
                  <div className="rounded-lg p-2">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <>
                    {renderMatchInfo(ongoingMatch, "Nuværende Kamp")}
                    {renderMatchInfo(upcomingMatch, "Næste Kamp")}

                    {!ongoingMatch && !upcomingMatch && (
                      <p className="text-center mt-4">
                        Ingen kampe planlagt for denne bane.
                      </p>
                    )}
                  </>
                )}
              </>
            ) : null}
          </div>
          <div className="lg:w-3/5">
            <CourtsMap onSelect={(label) => setSelectedCourtLabel(label)} />
          </div>
        </div>
      </Animation>
    </>
  );
};

export default CourtMapPage;
