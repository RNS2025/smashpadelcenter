import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import api from "../../api/api.ts";
import Tournament from "../../types/Tournament.ts";
import rankedInService from "../../services/rankedIn.ts";
import { RawMatch } from "../../types/DPFResultInterfaces.ts";
import { DPFMatchResult } from "../../types/DPFMatchResult";

const TournamentsResultsPage: React.FC = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<RawMatch[]>([]);
  const [savedResults, setSavedResults] = useState<DPFMatchResult[]>([]);
  const [handledMatches, setHandledMatches] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState({
    tournaments: false,
    matches: false,
    results: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Indlæs håndterede kampe fra localStorage
  useEffect(() => {
    const storedHandledMatches = localStorage.getItem("handledMatches");
    if (storedHandledMatches) {
      try {
        setHandledMatches(JSON.parse(storedHandledMatches));
      } catch (e) {
        console.error("Kunne ikke læse håndterede kampe fra localStorage:", e);
        // Nulstil hvis korrupt
        localStorage.removeItem("handledMatches");
      }
    }
  }, []);

  useEffect(() => {
    const fetchTournamentAndMatches = async () => {
      try {
        // Hent kommende turnering
        setLoading((prev) => ({ ...prev, tournaments: true }));
        const tournamentData = await rankedInService.getUpcomingTournament();
        setTournament(tournamentData);

        // Hent kampe for turneringen
        if (tournamentData?.eventId) {
          setLoading((prev) => ({ ...prev, matches: true }));
          const response = await api.get<{ Matches: RawMatch[] }>(
            "/GetAllMatches",
            {
              params: { tournamentId: tournamentData.eventId },
            }
          );
          setMatches(response.data.Matches || []);
        }

        // Hent gemte kampresultater
        setLoading((prev) => ({ ...prev, results: true }));
        try {
          const savedMatchResults =
            await rankedInService.getAllDPFMatchResults();
          console.log("Gemte resultater:", savedMatchResults);
          setSavedResults(savedMatchResults);
        } catch (resultErr) {
          console.error("Kunne ikke hente gemte resultater:", resultErr);
        }
      } catch (err: any) {
        const errorMessage = err.message || "Kunne ikke hente data";
        setError(errorMessage);
        console.error("Fejl ved hentning af data:", err);
      } finally {
        setLoading((prev) => ({
          ...prev,
          tournaments: false,
          matches: false,
          results: false,
        }));
      }
    };

    fetchTournamentAndMatches();
  }, []);

  // Funktion til at formatere sæt som læsbar tekst
  const formatSets = (sets: Array<{ player1: string; player2: string }>) => {
    return sets.map((set, index) => (
      <div key={index} className="text-gray-300 text-sm">
        Sæt {index + 1}: <span className="font-medium">{set.player1}</span> -{" "}
        <span className="font-medium">{set.player2}</span>
      </div>
    ));
  };

  const getMatchById = (matchId: number): RawMatch | undefined => {
    return matches.find((match) => match.Id === matchId);
  };

  const hasMatchSavedResult = (matchId: number): boolean => {
    return savedResults.some((result) => result.matchId === matchId);
  };

  const isMatchHandled = (matchId: number): boolean => {
    return handledMatches[matchId.toString()] === true;
  };

  const toggleMatchHandled = (matchId: number) => {
    const matchIdStr = matchId.toString();
    const newHandledMatches = {
      ...handledMatches,
      [matchIdStr]: !handledMatches[matchIdStr],
    };

    setHandledMatches(newHandledMatches);
    localStorage.setItem("handledMatches", JSON.stringify(newHandledMatches));
  }; // Funktion til at udlede spillere fra en kamp
  const getPlayersFromMatch = (match: RawMatch): string[] => {
    console.log("Match:", match);
    const players = [
      match.Challenger.Name,
      match.Challenger.Player2Name,
      match.Challenged.Name,
      match.Challenged.Player2Name,
    ].filter((name): name is string => Boolean(name));
    return players;
  }; // Funktion til at udlede spillere fra et resultat
  const getPlayersFromResult = (result: DPFMatchResult): string[] => {
    const { players } = result;
    if (!players) return [];

    const playersList = [
      players.player1,
      players.player2,
      players.player3,
      players.player4,
    ].filter((name): name is string => Boolean(name));

    return playersList;
  };

  // Helper function to check if a date is today
  const isToday = (dateString: string): boolean => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Hent kampe med resultater
  const matchesWithResults = matches.filter(
    (match) => match.MatchResult?.IsPlayed
  );
  // Filter savedResults to only show those created today
  const todayResults = savedResults.filter((result) =>
    isToday(result.createdAt)
  );
  console.log("Today's results:", todayResults.length);

  // Kombiner med gemte resultater, der ikke er i RankedIn
  const savedResultsMatchIds = new Set(
    todayResults.map((result) => result.matchId)
  );
  const allResultsMatchIds = new Set([
    ...matchesWithResults.map((match) => match.Id),
    ...savedResultsMatchIds,
  ]);

  // Opdel i håndterede og ikke-håndterede
  const notHandledMatchIds = Array.from(allResultsMatchIds).filter(
    (id) => !isMatchHandled(id)
  );
  const handledMatchIds = Array.from(allResultsMatchIds).filter((id) =>
    isMatchHandled(id)
  );

  return (
    <>
      <Helmet>
        <title>Kampresultater - Dommer Portal</title>
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col lg:flex-row">
        {/* Sidebar med kampresultater */}
        <div className="w-full lg:w-96 bg-slate-850 border-r border-brand-secondary p-6 flex-shrink-0 overflow-y-auto no-scrollbar">
          <h2 className="text-2xl font-bold text-brand-primary mb-6 animate-pulseSlow">
            Spillerindtastede Resultater
          </h2>
          <p className="text-gray-300 text-sm mb-4">
            Dette panel viser kampe resultater, som spillerne selv har
            indtastet. Brug afkrydsningsfelterne til at markere resultater som
            "håndteret", når du har behandlet dem.
          </p>

          {loading.tournaments || loading.matches || loading.results ? (
            <div className="bg-slate-750 border border-brand-secondary rounded-lg p-4 text-center text-brand-secondary animate-pulseSlow">
              ⏳ Indlæser data...
            </div>
          ) : error ? (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-center text-red-500">
              ❌ Fejl: {error}
            </div>
          ) : !tournament ? (
            <div className="bg-slate-750 border border-brand-accent rounded-lg p-4 text-center text-brand-accent">
              ℹ️ Ingen kommende turnering fundet.
            </div>
          ) : allResultsMatchIds.size === 0 ? (
            <div className="bg-slate-750 border border-brand-accent rounded-lg p-4 text-center text-brand-accent">
              ℹ️ Ingen kampe med resultater fundet for denne turnering.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ikke-håndterede resultater */}
              {notHandledMatchIds.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-yellow-500 mb-3 border-b border-yellow-500/30 pb-2">
                    Ikke Håndteret Endnu ({notHandledMatchIds.length})
                  </h3>
                  <div className="space-y-4">
                    {/* RankedIn kampe */}
                    {matchesWithResults
                      .filter((match) => notHandledMatchIds.includes(match.Id))
                      .map((match) => (
                        <div
                          key={match.Id}
                          className={`bg-slate-750 border ${
                            hasMatchSavedResult(match.Id)
                              ? "border-green-500"
                              : "border-brand-primary"
                          } rounded-lg p-4 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 animate-fadeIn`}
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-brand-primary">
                              Kamp ID: {match.Id}
                            </h3>
                            <div className="flex items-center gap-2">
                              {hasMatchSavedResult(match.Id) && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                  Også i database
                                </span>
                              )}
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-4 w-4 text-yellow-500 rounded"
                                  checked={isMatchHandled(match.Id)}
                                  onChange={() => toggleMatchHandled(match.Id)}
                                />
                                <span className="ml-2 text-xs text-yellow-500">
                                  Marker som håndteret
                                </span>
                              </label>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm">
                            <span className="font-bold text-brand-secondary">
                              Bane:
                            </span>{" "}
                            {match.Court || "Ikke angivet"}
                          </p>
                          <p className="text-gray-300 text-sm">
                            <span className="font-bold text-brand-secondary">
                              Række:
                            </span>{" "}
                            {match.Row || "Ikke angivet"}
                          </p>
                          <p className="text-gray-300 text-sm">
                            <span className="font-bold text-brand-secondary">
                              Dato:
                            </span>{" "}
                            {match.Date
                              ? new Date(match.Date).toLocaleString()
                              : "Ikke angivet"}
                          </p>
                          <p className="text-gray-300 text-sm mt-2">
                            <span className="font-bold text-brand-secondary">
                              Spillere:
                            </span>{" "}
                            {getPlayersFromMatch(match).join(", ") ||
                              "Ikke angivet"}
                          </p>
                          <p className="text-gray-300 text-sm mt-2">
                            <span className="font-bold text-brand-secondary">
                              Udfordrer:
                            </span>{" "}
                            <span
                              className={
                                match.MatchResult?.Score
                                  .IsFirstParticipantWinner
                                  ? "text-green-400 font-semibold"
                                  : ""
                              }
                            >
                              {match.Challenger.Name}{" "}
                              {match.Challenger.Player2Name &&
                                `& ${match.Challenger.Player2Name}`}
                              {match.MatchResult?.Score
                                .IsFirstParticipantWinner && " ⭐"}
                            </span>
                          </p>
                          <p className="text-gray-300 text-sm">
                            <span className="font-bold text-brand-secondary">
                              Udfordret:
                            </span>{" "}
                            <span
                              className={
                                !match.MatchResult?.Score
                                  .IsFirstParticipantWinner
                                  ? "text-green-400 font-semibold"
                                  : ""
                              }
                            >
                              {match.Challenged.Name}{" "}
                              {match.Challenged.Player2Name &&
                                `& ${match.Challenged.Player2Name}`}
                              {!match.MatchResult?.Score
                                .IsFirstParticipantWinner && " ⭐"}
                            </span>
                          </p>
                          <div className="mt-2">
                            <p className="text-brand-accent font-bold">
                              Resultat:
                            </p>
                            {match.MatchResult?.Score.DetailedScoring?.map(
                              (set, index) => (
                                <p
                                  key={index}
                                  className="text-gray-300 text-sm"
                                >
                                  Sæt {index + 1}: {set.FirstParticipantScore} -{" "}
                                  {set.SecondParticipantScore}
                                </p>
                              )
                            )}
                            {match.MatchResult?.Score.LoserTiebreak !==
                              null && (
                              <p className="text-gray-300 text-sm">
                                Tiebreak:{" "}
                                {match.MatchResult?.Score.LoserTiebreak} -{" "}
                                {(match.MatchResult?.Score.LoserTiebreak || 0) +
                                  2}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}{" "}
                    {/* Gemte resultater, der ikke er i RankedIn */}
                    {todayResults
                      .filter(
                        (result) =>
                          notHandledMatchIds.includes(result.matchId) &&
                          !matchesWithResults.some(
                            (m) => m.Id === result.matchId
                          )
                      )
                      .map((result) => {
                        const match = getMatchById(result.matchId);
                        // Extract players correctly from DPFMatchResult object
                        const players = result.players
                          ? getPlayersFromResult(result)
                          : [];
                        return (
                          <div
                            key={result._id}
                            className="bg-slate-750 border border-green-500 rounded-lg p-4 hover:shadow-[0_0_15px_rgba(22,163,74,0.3)] transition-all duration-300 animate-fadeIn"
                          >
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-bold text-green-500">
                                {result.tournamentName ||
                                  `Kamp ID: ${result.matchId}`}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                  Spillerindtastet
                                </span>
                                <label className="inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-yellow-500 rounded"
                                    checked={isMatchHandled(result.matchId)}
                                    onChange={() =>
                                      toggleMatchHandled(result.matchId)
                                    }
                                  />
                                  <span className="ml-2 text-xs text-yellow-500">
                                    Marker som håndteret
                                  </span>
                                </label>
                              </div>
                            </div>
                            <p className="text-gray-300 text-sm">
                              <span className="font-bold text-brand-secondary">
                                Række:
                              </span>{" "}
                              {result.row || "Ikke angivet"}
                            </p>
                            <p className="text-gray-300 text-sm mt-2">
                              <span className="font-bold text-brand-secondary">
                                Spillere:
                              </span>{" "}
                              {players.length > 0
                                ? players.join(", ")
                                : "Ikke angivet"}
                            </p>
                            {match && (
                              <>
                                <p className="text-gray-300 text-sm mt-2">
                                  <span className="font-bold text-brand-secondary">
                                    Udfordrer:
                                  </span>{" "}
                                  <span
                                    className={
                                      match.MatchResult?.Score
                                        .IsFirstParticipantWinner
                                        ? "text-green-400 font-semibold"
                                        : ""
                                    }
                                  >
                                    {match.Challenger.Name}{" "}
                                    {match.Challenger.Player2Name &&
                                      `& ${match.Challenger.Player2Name}`}
                                    {match.MatchResult?.Score
                                      .IsFirstParticipantWinner && " ⭐"}
                                  </span>
                                </p>
                                <p className="text-gray-300 text-sm">
                                  <span className="font-bold text-brand-secondary">
                                    Udfordret:
                                  </span>{" "}
                                  <span
                                    className={
                                      !match.MatchResult?.Score
                                        .IsFirstParticipantWinner
                                        ? "text-green-400 font-semibold"
                                        : ""
                                    }
                                  >
                                    {match.Challenged.Name}{" "}
                                    {match.Challenged.Player2Name &&
                                      `& ${match.Challenged.Player2Name}`}
                                    {!match.MatchResult?.Score
                                      .IsFirstParticipantWinner && " ⭐"}
                                  </span>
                                </p>
                              </>
                            )}
                            <div className="mt-2">
                              <p className="text-brand-accent font-bold">
                                Spillerindtastet resultat:
                              </p>
                              <div className="ml-2">
                                {formatSets(result.sets)}
                                {result.tiebreak && (
                                  <div className="text-gray-300 text-sm">
                                    Tiebreak:{" "}
                                    <span className="font-medium">
                                      {result.tiebreak.player1}
                                    </span>{" "}
                                    -{" "}
                                    <span className="font-medium">
                                      {result.tiebreak.player2}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                Gemt:{" "}
                                {new Date(result.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Håndterede resultater */}
              {handledMatchIds.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-green-500 mb-3 border-b border-green-500/30 pb-2">
                    Håndteret ({handledMatchIds.length})
                  </h3>
                  <div className="space-y-4 opacity-80">
                    {/* RankedIn kampe */}
                    {matchesWithResults
                      .filter((match) => handledMatchIds.includes(match.Id))
                      .map((match) => (
                        <div
                          key={match.Id}
                          className={`bg-slate-750 border ${
                            hasMatchSavedResult(match.Id)
                              ? "border-green-500"
                              : "border-brand-primary"
                          } rounded-lg p-4 transition-all duration-300 animate-fadeIn`}
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-brand-primary">
                              Kamp ID: {match.Id}
                            </h3>
                            <div className="flex items-center gap-2">
                              {hasMatchSavedResult(match.Id) && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                  Også i database
                                </span>
                              )}
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-4 w-4 text-green-500 rounded"
                                  checked={isMatchHandled(match.Id)}
                                  onChange={() => toggleMatchHandled(match.Id)}
                                />
                                <span className="ml-2 text-xs text-green-500">
                                  Fjern håndtering
                                </span>
                              </label>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm">
                            <span className="font-bold text-brand-secondary">
                              Bane:
                            </span>{" "}
                            {match.Court || "Ikke angivet"}
                          </p>
                          <p className="text-gray-300 text-sm">
                            <span className="font-bold text-brand-secondary">
                              Række:
                            </span>{" "}
                            {match.Row || "Ikke angivet"}
                          </p>
                          <p className="text-gray-300 text-sm">
                            <span className="font-bold text-brand-secondary">
                              Dato:
                            </span>{" "}
                            {match.Date
                              ? new Date(match.Date).toLocaleString()
                              : "Ikke angivet"}
                          </p>
                          <p className="text-gray-300 text-sm mt-2">
                            <span className="font-bold text-brand-secondary">
                              Spillere:
                            </span>{" "}
                            {getPlayersFromMatch(match).join(", ") ||
                              "Ikke angivet"}
                          </p>
                          <p className="text-gray-300 text-sm mt-2">
                            <span className="font-bold text-brand-secondary">
                              Udfordrer:
                            </span>{" "}
                            <span
                              className={
                                match.MatchResult?.Score
                                  .IsFirstParticipantWinner
                                  ? "text-green-400 font-semibold"
                                  : ""
                              }
                            >
                              {match.Challenger.Name}{" "}
                              {match.Challenger.Player2Name &&
                                `& ${match.Challenger.Player2Name}`}
                              {match.MatchResult?.Score
                                .IsFirstParticipantWinner && " ⭐"}
                            </span>
                          </p>
                          <p className="text-gray-300 text-sm">
                            <span className="font-bold text-brand-secondary">
                              Udfordret:
                            </span>{" "}
                            <span
                              className={
                                !match.MatchResult?.Score
                                  .IsFirstParticipantWinner
                                  ? "text-green-400 font-semibold"
                                  : ""
                              }
                            >
                              {match.Challenged.Name}{" "}
                              {match.Challenged.Player2Name &&
                                `& ${match.Challenged.Player2Name}`}
                              {!match.MatchResult?.Score
                                .IsFirstParticipantWinner && " ⭐"}
                            </span>
                          </p>
                          <div className="mt-2">
                            <p className="text-brand-accent font-bold">
                              Resultat:
                            </p>
                            {match.MatchResult?.Score.DetailedScoring?.map(
                              (set, index) => (
                                <p
                                  key={index}
                                  className="text-gray-300 text-sm"
                                >
                                  Sæt {index + 1}: {set.FirstParticipantScore} -{" "}
                                  {set.SecondParticipantScore}
                                </p>
                              )
                            )}
                            {match.MatchResult?.Score.LoserTiebreak !==
                              null && (
                              <p className="text-gray-300 text-sm">
                                Tiebreak:{" "}
                                {match.MatchResult?.Score.LoserTiebreak} -{" "}
                                {(match.MatchResult?.Score.LoserTiebreak || 0) +
                                  2}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}{" "}
                    {/* Gemte resultater, der ikke er i RankedIn */}
                    {savedResults
                      .filter(
                        (result) =>
                          handledMatchIds.includes(result.matchId) &&
                          !matchesWithResults.some(
                            (m) => m.Id === result.matchId
                          )
                      )
                      .map((result) => {
                        const match = getMatchById(result.matchId);
                        // Extract players correctly from DPFMatchResult object
                        const players = result.players
                          ? [
                              result.players.firstPlayerName,
                              result.players.secondPlayerName,
                              result.players.thirdPlayerName,
                              result.players.fourthPlayerName,
                            ].filter((name) => name && name !== "")
                          : match
                          ? getPlayersFromMatch(match)
                          : [];
                        return (
                          <div
                            key={result._id}
                            className="bg-slate-750 border border-green-500 rounded-lg p-4 transition-all duration-300 animate-fadeIn"
                          >
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-bold text-green-500">
                                {result.tournamentName ||
                                  `Kamp ID: ${result.matchId}`}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                  Spillerindtastet
                                </span>
                                <label className="inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-green-500 rounded"
                                    checked={isMatchHandled(result.matchId)}
                                    onChange={() =>
                                      toggleMatchHandled(result.matchId)
                                    }
                                  />
                                  <span className="ml-2 text-xs text-green-500">
                                    Fjern håndtering
                                  </span>
                                </label>
                              </div>
                            </div>
                            <p className="text-gray-300 text-sm">
                              <span className="font-bold text-brand-secondary">
                                Række:
                              </span>{" "}
                              {result.row || "Ikke angivet"}
                            </p>
                            <p className="text-gray-300 text-sm mt-2">
                              <span className="font-bold text-brand-secondary">
                                Spillere:
                              </span>{" "}
                              {players.length > 0
                                ? players.join(", ")
                                : "Ikke angivet"}
                            </p>
                            {match && (
                              <>
                                <p className="text-gray-300 text-sm mt-2">
                                  <span className="font-bold text-brand-secondary">
                                    Udfordrer:
                                  </span>{" "}
                                  <span
                                    className={
                                      match.MatchResult?.Score
                                        .IsFirstParticipantWinner
                                        ? "text-green-400 font-semibold"
                                        : ""
                                    }
                                  >
                                    {match.Challenger.Name}{" "}
                                    {match.Challenger.Player2Name &&
                                      `& ${match.Challenger.Player2Name}`}
                                    {match.MatchResult?.Score
                                      .IsFirstParticipantWinner && " ⭐"}
                                  </span>
                                </p>
                                <p className="text-gray-300 text-sm">
                                  <span className="font-bold text-brand-secondary">
                                    Udfordret:
                                  </span>{" "}
                                  <span
                                    className={
                                      !match.MatchResult?.Score
                                        .IsFirstParticipantWinner
                                        ? "text-green-400 font-semibold"
                                        : ""
                                    }
                                  >
                                    {match.Challenged.Name}{" "}
                                    {match.Challenged.Player2Name &&
                                      `& ${match.Challenged.Player2Name}`}
                                    {!match.MatchResult?.Score
                                      .IsFirstParticipantWinner && " ⭐"}
                                  </span>
                                </p>
                              </>
                            )}
                            <div className="mt-2">
                              <p className="text-brand-accent font-bold">
                                Spillerindtastet resultat:
                              </p>
                              <div className="ml-2">
                                {formatSets(result.sets)}
                                {result.tiebreak && (
                                  <div className="text-gray-300 text-sm">
                                    Tiebreak:{" "}
                                    <span className="font-medium">
                                      {result.tiebreak.player1}
                                    </span>{" "}
                                    -{" "}
                                    <span className="font-medium">
                                      {result.tiebreak.player2}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                Gemt:{" "}
                                {new Date(result.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Hovedindhold med iframe */}
        <div className="flex-1 flex flex-col">
          <div className="bg-slate-850 border-b border-brand-secondary p-4">
            <h1 className="text-3xl font-bold text-brand-primary text-center animate-fadeIn">
              Dommer Resultatindtastning
            </h1>
            {tournament && (
              <p className="text-gray-300 text-center mt-2">
                Turnering: {tournament.eventName}
              </p>
            )}
          </div>
          {tournament?.eventUrl ? (
            <iframe
              src={`https://rankedin.com${tournament.eventUrl}/draws`}
              title="RankedIn Resultatindtastning"
              className="w-full flex-1 border-none min-h-[800px]"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-950 min-h-[400px]">
              <p className="text-brand-secondary text-xl">
                Ingen turnering valgt. Vent venligst eller prøv igen.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TournamentsResultsPage;
