import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import rankedInService from "../../services/rankedIn.ts";
import Match from "../../types/Match.ts";
import PlayerData from "../../types/PlayerData.ts";
import TournamentEvent from "../../types/Event.ts";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import Animation from "../../components/misc/Animation.tsx";

const PlayerPage = () => {
  const { rankedInId } = useParams<{
    rankedInId?: string;
  }>();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [nextEvent, setNextEvent] = useState<TournamentEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!rankedInId) {
        alert("Spiller mangler RankedIn ID.");
        navigate(-1);
        return;
      }

      try {
        const playerDetails = await rankedInService.getPlayerDetails(
          rankedInId,
          "da"
        );
        if (!playerDetails || !playerDetails.Header?.PlayerId) {
          setError("Kunne ikke finde spilleroplysninger.");
          setLoading(false);
          return;
        }
        setPlayerData(playerDetails);
        console.log(
          "Player ID:",
          playerDetails.Header?.PlayerId,
          "RankedInId:",
          rankedInId
        );

        const eventsResponse = await rankedInService.getParticipatedEvents(
          playerDetails.Header?.PlayerId || 0,
          "da"
        );
        console.log("Participated events:", eventsResponse);

        const eventsArray = eventsResponse.Payload || [];
        if (Array.isArray(eventsArray) && eventsArray.length > 0) {
          const futureEvents = eventsArray.filter((event) => {
            const eventDate = new Date(event.StartDate);
            const now = new Date();
            return eventDate >= new Date(now.setHours(0, 0, 0, 0));
          }) as TournamentEvent[];

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const todayEvents = futureEvents.filter((event) => {
            const eventStartDate = new Date(event.StartDate);
            return eventStartDate >= today && eventStartDate < tomorrow;
          });

          const upcomingEvent =
            todayEvents[0] ||
            futureEvents.sort(
              (a, b) =>
                new Date(a.StartDate).getTime() -
                new Date(b.StartDate).getTime()
            )[0];

          if (upcomingEvent) {
            setNextEvent(upcomingEvent);
            const eventMatches = await rankedInService.getEventMatches(
              upcomingEvent.Id,
              "da"
            );
            console.log("Raw event matches:", eventMatches);

            if (eventMatches && Array.isArray(eventMatches.Matches)) {
              const formattedMatches = eventMatches.Matches.map(
                (match: any) => {
                  const formattedMatch = {
                    matchId: match.Id,
                    round: match.Round || 0,
                    date: match.Date,
                    courtName: match.Court,
                    matchType: match.Draw,
                    isPlayed: match.MatchResult?.IsPlayed || false,
                    durationMinutes: match.MatchResult?.TotalDurationInMinutes,
                    score:
                      match.MatchResult && match.MatchResult.Score
                        ? {
                            FirstParticipantScore:
                              match.MatchResult.Score.FirstParticipantScore,
                            SecondParticipantScore:
                              match.MatchResult.Score.SecondParticipantScore,
                            IsFirstParticipantWinner:
                              match.MatchResult.Score.IsFirstParticipantWinner,
                            DetailedScoring: match.MatchResult.Score
                              .DetailedScoring
                              ? match.MatchResult.Score.DetailedScoring.map(
                                  (set: any) => ({
                                    FirstParticipantScore:
                                      set.FirstParticipantScore,
                                    SecondParticipantScore:
                                      set.SecondParticipantScore,
                                    IsFirstParticipantWinner:
                                      set.IsFirstParticipantWinner,
                                    LoserTiebreak: set.LoserTiebreak,
                                    DetailedScoring: set.DetailedScoring,
                                    LabelClass: set.LabelClass || "", // Default to empty string if missing
                                  })
                                )
                              : null,
                            LoserTiebreak:
                              match.MatchResult.Score.LoserTiebreak,
                            LabelClass:
                              match.MatchResult.Score.LabelClass || "",
                          }
                        : null,
                    challenger: {
                      firstPlayer: {
                        Name: match.Challenger.Name,
                        Id: match.Challenger.Player1Id,
                        CountryCode:
                          match.Challenger.CountryShort?.toUpperCase() || "DK",
                        Url: match.Challenger.Player1Url,
                      },
                      secondPlayer: match.Challenger.Player2Name
                        ? {
                            Name: match.Challenger.Player2Name,
                            Id: match.Challenger.Player2Id,
                            CountryCode:
                              match.Challenger.Player2CountryShort?.toUpperCase() ||
                              "DK",
                            Url: match.Challenger.Player2Url,
                          }
                        : null,
                    },
                    challenged: {
                      firstPlayer: {
                        Name: match.Challenged.Name,
                        Id: match.Challenged.Player1Id,
                        CountryCode:
                          match.Challenged.CountryShort?.toUpperCase() || "DK",
                        Url: match.Challenged.Player1Url,
                      },
                      secondPlayer: match.Challenged.Player2Name
                        ? {
                            Name: match.Challenged.Player2Name,
                            Id: match.Challenged.Player2Id,
                            CountryCode:
                              match.Challenged.Player2CountryShort?.toUpperCase() ||
                              "DK",
                            Url: match.Challenged.Player2Url,
                          }
                        : null,
                    },
                    winnerParticipantId:
                      match.MatchResult?.WinnerParticipantId || null,
                  };
                  console.log(`Match ${match.Id} score:`, formattedMatch.score);
                  return formattedMatch;
                }
              );

              const playerId = playerDetails.Header?.PlayerId;
              const playerMatches = formattedMatches.filter(
                (match) =>
                  match.challenger?.firstPlayer?.Id === playerId ||
                  match.challenger?.secondPlayer?.Id === playerId ||
                  match.challenged?.firstPlayer?.Id === playerId ||
                  match.challenged?.secondPlayer?.Id === playerId
              );

              console.log("Player matches:", playerMatches);
              setMatches(playerMatches);
            } else {
              console.error("No matches found for event:", eventMatches);
              setMatches([]);
            }
          } else {
            console.log("No upcoming events found");
            setMatches([]);
          }
        } else {
          console.log("No events found");
          setMatches([]);
        }
      } catch (err) {
        setError("Kunne ikke indlæse spillerdata eller kommende begivenheder.");
        console.error("Fetch error:", err);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rankedInId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-950 to-slate-850">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-brand-primary shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        <p className="ml-6 text-xl font-sans font-semibold text-brand-primary animate-pulseSlow">
          Forbereder data...
        </p>
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="container mx-auto p-8 text-center bg-gradient-to-br from-slate-950 to-slate-850 min-h-screen">
        <p className="text-2xl font-sans font-bold text-brand-accent animate-fadeIn">
          {error || "Ingen spillerdata tilgængelig."}
        </p>
      </div>
    );
  }

  return (
    <Animation>
      <div className="mx-auto p-8 max-w-5xl bg-gradient-to-br from-slate-950 to-slate-850 min-h-screen font-sans">
        {/* Player Profile Section */}
        {playerData.Header && (
          <div className="bg-slate-850 bg-opacity-90 backdrop-blur-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-2xl p-8 mb-10 border border-slate-750 transition-all duration-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center gap-10">
              {playerData.Header.ImageThumbnailUrl && (
                <img
                  src={playerData.Header.ImageThumbnailUrl}
                  alt={`${playerData.Header.FullName}'s profil`}
                  className="w-40 h-40 rounded-full object-cover border-4 border-brand-primary shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-transform duration-500 hover:scale-110"
                />
              )}
              <div>
                <h1 className="text-5xl font-bold text-brand-primary mb-4 animate-fadeInDown">
                  {playerData.Header.FullName || "Anonym spiller"}
                </h1>
                <div className="space-y-3 text-slate-300 text-lg font-medium">
                  <p>
                    <strong>ID:</strong> {playerData.Header.RankedinId}
                  </p>
                  {playerData.Header.HomeClubName && (
                    <p>
                      <strong>Klub:</strong>{" "}
                      <a
                        href={playerData.Header.HomeClubUrl || "#"}
                        className="text-brand-secondary hover:text-brand-primary transition-colors duration-300"
                      >
                        {playerData.Header.HomeClubName}
                      </a>
                    </p>
                  )}
                  {playerData.Header.CountryShort && (
                    <p>
                      <strong>Land:</strong>{" "}
                      {playerData.Header.CountryShort.toUpperCase()}
                    </p>
                  )}
                  {playerData.Header.Age && (
                    <p>
                      <strong>Alder:</strong> {playerData.Header.Age}
                    </p>
                  )}
                  {playerData.Header.Form &&
                  Array.isArray(playerData.Header.Form) &&
                  playerData.Header.Form.length > 0 ? (
                    <p>
                      <strong>Form:</strong>{" "}
                      {playerData.Header.Form.map(
                        (result: string, index: number) => (
                          <span
                            key={index}
                            className={`${
                              result === "W" ? "text-green-500" : "text-red-500"
                            } font-bold text-xl`}
                          >
                            {result}{" "}
                          </span>
                        )
                      )}
                    </p>
                  ) : (
                    <p>
                      <strong>Form:</strong> Ingen kampe registreret
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics Section */}
            {playerData.Statistics && (
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900 bg-opacity-90 backdrop-blur-sm p-6 rounded-xl border border-slate-750">
                <div>
                  <h3 className="text-2xl font-semibold text-brand-primary mb-4">
                    {new Date().getFullYear()} Statistik
                  </h3>
                  <p className="text-slate-300 text-lg font-medium">
                    <strong>Doubles W-L:</strong>{" "}
                    {playerData.Statistics.WinLossDoublesCurrentYear}
                  </p>
                  <p className="text-slate-300 text-lg font-medium">
                    <strong>Events:</strong>{" "}
                    {playerData.Statistics.EventsParticipatedDoublesCurrentYear}
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-brand-primary mb-4">
                    Karriere
                  </h3>
                  <p className="text-slate-300 text-lg font-medium">
                    <strong>Doubles W-L:</strong>{" "}
                    {playerData.Statistics.CareerWinLossDoubles}
                  </p>
                  <p className="text-slate-300 text-lg font-medium">
                    <strong>Events:</strong>{" "}
                    {playerData.Statistics.CareerEventsParticipatedDoubles}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Next Event Section */}
        {nextEvent && (
          <div className="bg-slate-850 bg-opacity-90 backdrop-blur-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-2xl p-8 mb-10 border border-slate-750 transition-all duration-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] animate-fadeIn">
            <h2 className="text-3xl font-bold text-brand-primary mb-6 animate-fadeInDown">
              Næste begivenhed: {nextEvent.Name}
            </h2>
            <div className="space-y-3 text-slate-300 text-lg font-medium">
              <p>
                <strong>Dato:</strong>{" "}
                {format(new Date(nextEvent.StartDate), "dd. MMMM yyyy", {
                  locale: da,
                })}
                {nextEvent.EndDate &&
                  nextEvent.EndDate !== nextEvent.StartDate &&
                  ` - ${format(new Date(nextEvent.EndDate), "dd. MMMM yyyy", {
                    locale: da,
                  })}`}
              </p>
            </div>
          </div>
        )}
        {/* Matches Section */}
        <h2 className="text-4xl font-bold text-brand-primary mb-10 animate-fadeInDown">
          Kommende kampe for {playerData.Header?.FullName || "spiller"}
        </h2>
        {/* Check that matches is an array and has length */}
        {!Array.isArray(matches) || matches.length === 0 ? (
          <p className="text-xl text-slate-300 font-medium animate-fadeIn">
            Ingen kommende kampe registreret.
          </p>
        ) : (
          <div className="grid gap-8">
            {matches.map((match) => (
              <div
                key={match.matchId || `match-${Math.random()}`}
                className="bg-slate-850 bg-opacity-90 backdrop-blur-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-2xl p-6 border border-slate-750 transition-all duration-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:-translate-y-2 animate-fadeIn"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-brand-primary">
                    {match.matchType?.replace(/([a-z])([A-Z])/g, "$1 $2") ||
                      "Kamp"}{" "}
                    {match.matchType !== "RoundRobin" && match.round
                      ? `- Runde ${match.round}`
                      : ""}
                  </h2>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      match.isPlayed
                        ? "bg-green-900 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                        : "bg-brand-accent text-slate-950 shadow-[0_0_10px_rgba(166,76,235,0.5)]"
                    } transition-all duration-300 hover:scale-105 animate-pulseSlow`}
                  >
                    {match.isPlayed ? "Afsluttet" : "Planlagt"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {" "}
                    <p
                      className={`text-slate-300 text-lg font-medium ${
                        match.isPlayed && match.score?.IsFirstParticipantWinner
                          ? "font-bold text-brand-primary bg-opacity-20 bg-green-500 px-2 py-1 rounded"
                          : ""
                      }`}
                    >
                      <strong>Hold 1:</strong>{" "}
                      {match.challenger?.firstPlayer?.Name || "Ukendt"}
                      {match.challenger?.secondPlayer
                        ? ` & ${match.challenger.secondPlayer.Name}`
                        : ""}
                      {match.isPlayed &&
                        match.score?.IsFirstParticipantWinner && (
                          <span className="ml-2 text-green-500">🏆</span>
                        )}
                    </p>
                    <p
                      className={`text-slate-300 text-lg font-medium ${
                        match.isPlayed && !match.score?.IsFirstParticipantWinner
                          ? "font-bold text-brand-primary bg-opacity-20 bg-green-500 px-2 py-1 rounded"
                          : ""
                      }`}
                    >
                      <strong>Hold 2:</strong>{" "}
                      {match.challenged?.firstPlayer?.Name || "Ukendt"}
                      {match.challenged?.secondPlayer
                        ? ` & ${match.challenged.secondPlayer.Name}`
                        : ""}
                      {match.isPlayed &&
                        !match.score?.IsFirstParticipantWinner && (
                          <span className="ml-2 text-green-500">🏆</span>
                        )}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-300 text-lg font-medium">
                      <strong>Tid:</strong>{" "}
                      {match.date
                        ? format(
                            new Date(match.date),
                            "dd. MMMM yyyy - HH:mm",
                            {
                              locale: da,
                            }
                          )
                        : "Ikke fastsat"}
                    </p>
                    <p className="text-slate-300 text-lg font-medium">
                      <strong>Bane:</strong> {match.courtName || "Ikke tildelt"}
                    </p>
                    <p className="text-slate-300 text-lg font-medium">
                      <strong>Varighed:</strong>{" "}
                      {match.durationMinutes
                        ? `${match.durationMinutes} min.`
                        : "Ikke sat"}
                    </p>
                  </div>
                </div>

                {/* Score Section */}
                {match.isPlayed && match.score && (
                  <div className="mt-6 pt-4 border-t border-slate-750 text-slate-300">
                    <h3 className="font-semibold text-xl text-brand-primary mb-4">
                      Resultat
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div>
                        <p className="font-medium text-lg">
                          Score:
                          <span className="ml-2 text-xl text-brand-primary font-bold">
                            {match.score.FirstParticipantScore} -{" "}
                            {match.score.SecondParticipantScore}
                          </span>
                          <span className="ml-2 text-sm font-normal text-slate-400">
                            (
                            {match.score.IsFirstParticipantWinner
                              ? "Hold 1 vandt"
                              : "Hold 2 vandt"}
                            )
                          </span>
                        </p>
                      </div>
                      {match.score.DetailedScoring &&
                      Array.isArray(match.score.DetailedScoring) &&
                      match.score.DetailedScoring.length > 0 ? (
                        <div>
                          <p className="font-medium text-lg">Sæt:</p>
                          <div className="flex gap-3 flex-wrap">
                            {match.score.DetailedScoring.map((set, index) => (
                              <span
                                key={index}
                                className={`bg-slate-900 px-4 py-2 rounded-full text-sm text-slate-300 font-medium shadow-[0_0_8px_rgba(6,182,212,0.3)] ${
                                  set.IsFirstParticipantWinner
                                    ? "border-l-4 border-green-500"
                                    : "border-r-4 border-green-500"
                                }`}
                                aria-label={`Sæt ${index + 1}: Hold 1 ${
                                  set.FirstParticipantScore
                                }, Hold 2 ${set.SecondParticipantScore}`}
                              >
                                {set.FirstParticipantScore}-
                                {set.SecondParticipantScore}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="font-medium text-lg text-slate-400">
                          Ingen sætdetaljer tilgængelig
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Animation>
  );
};

export default PlayerPage;
