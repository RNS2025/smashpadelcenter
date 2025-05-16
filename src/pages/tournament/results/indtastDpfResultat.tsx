/* eslint-disable no-irregular-whitespace */
import React, { useEffect, useState, Component, ErrorInfo } from "react";
import axios from "axios";
import { useUser } from "../../../context/UserContext.tsx";
import Match from "../../../types/Match.ts";
import { MatchScore } from "../../../types/Match.ts";
import Player from "../../../types/Player.ts";
import api from "../../../api/api.ts";
import {
  RawMatch,
  OrganizationEventsApiResponse,
} from "../../../types/DPFResultInterfaces.ts";
import rankedInService from "../../../services/rankedIn.ts";

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-400 p-6 text-center font-sans backdrop-blur-md bg-red-950/20 rounded-lg shadow-[0_0_20px_rgba(255,0,0,0.3)]">
          Error: {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

const RANKEDIN_API_BASE_URL = "https://api.rankedin.com/v1";
const RANKEDIN_ORGANIZATION_ID = 5070;

const EnterResultPage: React.FC = () => {
  const { user, isAuthenticated, loading: userLoading } = useUser();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);
  const [errorMatches, setErrorMatches] = useState<string | null>(null);
  const [enteringResultForMatchId, setEnteringResultForMatchId] = useState<
    number | null
  >(null);
  const [currentMatchResultInput, setCurrentMatchResultInput] = useState<{
    sets: { player1: string; player2: string }[];
    tiebreak?: { player1: string; player2: string };
  } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  const addDebugLog = (message: string, data?: any) => {
    const formattedData = data ? JSON.stringify(data, null, 2) : "";
    console.log(
      `[DEBUG] ${message}${formattedData ? `: ${formattedData}` : ""}`
    );
  };

  const extractRankedInIdFromUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    const match = url.match(/R\d+/);
    return match ? match[0] : null;
  };

  const transformRawMatchToMatch = (rawMatch: RawMatch): Match => {
    addDebugLog(`Transforming raw match ID: ${rawMatch.Id}`);
    try {
      const challengerPlayer1: Player = {
        id: rawMatch.Challenger.Player1Id,
        Name: rawMatch.Challenger.Name.split(" ")[0],
        RankedInId:
          extractRankedInIdFromUrl(rawMatch.Challenger.Player1Url) ||
          rawMatch.Challenger.Player1Id.toString(),
      };
      const challengerPlayer2: Player | null = rawMatch.Challenger.Player2Id
        ? {
            id: rawMatch.Challenger.Player2Id,
            Name: rawMatch.Challenger.Player2Name || "",
            RankedInId:
              extractRankedInIdFromUrl(rawMatch.Challenger.Player2Url) ||
              rawMatch.Challenger.Player2Id.toString(),
          }
        : null;

      const challengedPlayer1: Player = {
        id: rawMatch.Challenged.Player1Id,
        Name: rawMatch.Challenged.Name.split(" ")[0],
        RankedInId:
          extractRankedInIdFromUrl(rawMatch.Challenged.Player1Url) ||
          rawMatch.Challenged.Player1Id.toString(),
      };
      const challengedPlayer2: Player | null = rawMatch.Challenged.Player2Id
        ? {
            id: rawMatch.Challenged.Player2Id,
            Name: rawMatch.Challenged.Player2Name || "",
            RankedInId:
              extractRankedInIdFromUrl(rawMatch.Challenged.Player2Url) ||
              rawMatch.Challenged.Player2Id.toString(),
          }
        : null;

      const transformedMatch: Match = {
        matchId: rawMatch.Id,
        round: 0,
        date: rawMatch.Date,
        courtName: rawMatch.Court,
        durationMinutes: null,
        challenger: {
          firstPlayer: challengerPlayer1,
          secondPlayer: challengerPlayer2,
        },
        challenged: {
          firstPlayer: challengedPlayer1,
          secondPlayer: challengedPlayer2,
        },
        score: null,
        isPlayed: false,
        winnerParticipantId: null,
        matchType: rawMatch.TournamentClassName.includes("Herrer")
          ? "Elimination"
          : "RoundRobin",
      };
      return transformedMatch;
    } catch (error: any) {
      addDebugLog(`Error transforming match ID: ${rawMatch.Id}`, {
        error: error.message,
      });
      throw error;
    }
  };

  const fetchMatchResults = async (matchIds: number[]) => {
    addDebugLog(`Fetching results for match IDs`, matchIds);
    const results: Record<
      number,
      { score: MatchScore | null; isPlayed: boolean }
    > = {};
    for (const matchId of matchIds) {
      try {
        const result = await rankedInService.getSpecificDPFMatchResult(matchId);
        addDebugLog(`Fetched result for match ${matchId}`, result);
        results[matchId] = result;
      } catch (error: any) {
        addDebugLog(`Error fetching result for match ${matchId}`, {
          error: error.message,
        });
        results[matchId] = { score: null, isPlayed: false };
      }
    }
    return results;
  };

  useEffect(() => {
    addDebugLog(
      `useEffect triggered - userLoading: ${userLoading}, isAuthenticated: ${isAuthenticated}`,
      { user }
    );

    const fetchTournamentAndMatches = async () => {
      if (
        userLoading ||
        !isAuthenticated ||
        user === null ||
        user.rankedInId === undefined ||
        user.rankedInId === null
      ) {
        addDebugLog(
          `Skipping fetch - userLoading: ${userLoading}, isAuthenticated: ${isAuthenticated}, rankedInId: ${user?.rankedInId}`
        );
        if (!userLoading && !isAuthenticated) {
          setMatches([]);
          setLoadingMatches(false);
          addDebugLog("User not authenticated, cleared matches");
        } else if (
          !userLoading &&
          isAuthenticated &&
          (user === null ||
            user.rankedInId === undefined ||
            user.rankedInId === null)
        ) {
          setErrorMatches(
            "Dit RankedIn ID er ikke tilgængeligt. Kan ikke hente kvalificerede kampe."
          );
          setMatches([]);
          setLoadingMatches(false);
          addDebugLog("Authenticated but missing rankedInId");
        }
        return;
      }

      try {
        setLoadingMatches(true);
        setErrorMatches(null);
        addDebugLog("Fetching tournament data");

        const tournamentResponse =
          await axios.get<OrganizationEventsApiResponse>(
            `${RANKEDIN_API_BASE_URL}/Organization/GetOrganisationEventsAsync?organisationId=${RANKEDIN_ORGANIZATION_ID}&IsFinished=false&Language=en&EventType=4&skip=0&take=1`
          );
        addDebugLog(`Tournament API response`, {
          tournamentCount: tournamentResponse.data.payload?.length,
        });

        const upcomingTournament = tournamentResponse.data.payload?.[0];
        if (!upcomingTournament) {
          setErrorMatches(
            "Ingen kommende turnering fundet for denne organisation."
          );
          setMatches([]);
          setLoadingMatches(false);
          addDebugLog("No upcoming tournament found");
          return;
        }

        const tournamentId = upcomingTournament.eventId;
        addDebugLog(`Fetching matches for tournament ID: ${tournamentId}`);

        const matchesResponse = await axios.get<{ Matches: RawMatch[] }>(
          `${RANKEDIN_API_BASE_URL}/tournament/GetMatchesSectionAsync?Id=${tournamentId}&LanguageCode=en&IsReadonly=true`
        );
        addDebugLog(
          `Matches API response received, match count: ${matchesResponse.data.Matches.length}`
        );

        const rawFetchedMatches = matchesResponse.data.Matches;
        const userRankedInIdString = user.rankedInId;

        const rawUserMatches = rawFetchedMatches.filter((rawMatch) => {
          const challengerPlayer1Id = extractRankedInIdFromUrl(
            rawMatch.Challenger.Player1Url
          );
          const challengerPlayer2Id = extractRankedInIdFromUrl(
            rawMatch.Challenger.Player2Url
          );
          const challengedPlayer1Id = extractRankedInIdFromUrl(
            rawMatch.Challenged.Player1Url
          );
          const challengedPlayer2Id = extractRankedInIdFromUrl(
            rawMatch.Challenged.Player2Url
          );

          const isUserMatch =
            (challengerPlayer1Id &&
              challengerPlayer1Id === userRankedInIdString) ||
            (challengerPlayer2Id &&
              challengerPlayer2Id === userRankedInIdString) ||
            (challengedPlayer1Id &&
              challengedPlayer1Id === userRankedInIdString) ||
            (challengedPlayer2Id &&
              challengedPlayer2Id === userRankedInIdString);

          addDebugLog(`Match ID: ${rawMatch.Id}, isUserMatch: ${isUserMatch}`, {
            playerIds: {
              challengerPlayer1Id,
              challengerPlayer2Id,
              challengedPlayer1Id,
              challengedPlayer2Id,
            },
          });
          return isUserMatch;
        });

        const transformedMatches = rawUserMatches.map(transformRawMatchToMatch);
        addDebugLog(`Transformed matches`, {
          count: transformedMatches.length,
          matchIds: transformedMatches.map((m) => m.matchId),
        });

        const matchResults = await fetchMatchResults(
          transformedMatches.map((m) => m.matchId)
        );
        const updatedMatches = transformedMatches.map((match) => {
          const result = matchResults[match.matchId];
          return {
            ...match,
            score: result?.score || null,
            isPlayed: result?.isPlayed || false,
          };
        });
        addDebugLog(`Updated matches with results`, {
          totalMatches: updatedMatches.length,
          matchesWithResults: updatedMatches
            .filter((m) => m.score && m.isPlayed)
            .map((m) => ({
              matchId: m.matchId,
              score: m.score,
              isPlayed: m.isPlayed,
            })),
        });

        setMatches(updatedMatches);
      } catch (err: any) {
        const errorMessage =
          "Kunne ikke hente data fra RankedIn API: " +
          (err.message || "Ukendt fejl");
        setErrorMatches(errorMessage);
        console.error("RankedIn API fetch error:", err);
        addDebugLog(`Fetch error`, { error: errorMessage });
      } finally {
        setLoadingMatches(false);
        addDebugLog("Fetch completed");
      }
    };

    if (
      !userLoading &&
      isAuthenticated &&
      user !== null &&
      user.rankedInId !== undefined &&
      user.rankedInId !== null
    ) {
      fetchTournamentAndMatches();
    } else {
      addDebugLog("Conditions not met for fetching matches");
    }
  }, [userLoading, isAuthenticated, user]);

  const handleSetChange = (
    setIndex: number,
    participant: "player1" | "player2",
    value: string
  ) => {
    if (!currentMatchResultInput) return;
    addDebugLog(`Updating set ${setIndex + 1} for ${participant}: ${value}`);
    const newSets = [...currentMatchResultInput.sets];
    newSets[setIndex] = { ...newSets[setIndex], [participant]: value };
    setCurrentMatchResultInput({ ...currentMatchResultInput, sets: newSets });
  };

  const handleTiebreakChange = (
    participant: "player1" | "player2",
    value: string
  ) => {
    if (!currentMatchResultInput || !currentMatchResultInput.tiebreak) return;
    addDebugLog(`Updating tiebreak for ${participant}: ${value}`);
    const newTiebreak = {
      ...currentMatchResultInput.tiebreak,
      [participant]: value,
    };
    setCurrentMatchResultInput({
      ...currentMatchResultInput,
      tiebreak: newTiebreak,
    });
  };

  const addSet = () => {
    if (!currentMatchResultInput) return;
    addDebugLog("Adding new set");
    setCurrentMatchResultInput({
      ...currentMatchResultInput,
      sets: [...currentMatchResultInput.sets, { player1: "", player2: "" }],
    });
  };

  const toggleTiebreak = () => {
    if (!currentMatchResultInput) return;
    if (currentMatchResultInput.tiebreak) {
      addDebugLog("Removing tiebreak");
      const { tiebreak, ...rest } = currentMatchResultInput;
      setCurrentMatchResultInput(rest);
    } else {
      addDebugLog("Adding tiebreak");
      setCurrentMatchResultInput({
        ...currentMatchResultInput,
        tiebreak: { player1: "", player2: "" },
      });
    }
  };

  const handleEnterResultClick = (match: Match) => {
    addDebugLog(`Entering result for match ID: ${match.matchId}`, {
      hasResult: !!match.score && match.isPlayed,
    });
    setEnteringResultForMatchId(match.matchId);
    setExpandedMatchId(match.matchId);
    if (match.score && match.isPlayed) {
      const sets = match.score.DetailedScoring
        ? match.score.DetailedScoring.map((set) => ({
            player1: set.FirstParticipantScore.toString(),
            player2: set.SecondParticipantScore.toString(),
          }))
        : [{ player1: "", player2: "" }];
      const tiebreak = match.score.LoserTiebreak
        ? {
            player1: match.score.LoserTiebreak.toString(),
            player2: (match.score.LoserTiebreak + 2).toString(),
          }
        : undefined;
      setCurrentMatchResultInput({ sets, tiebreak });
    } else {
      setCurrentMatchResultInput({
        sets: [{ player1: "", player2: "" }],
        tiebreak: undefined,
      });
    }
    setSaveError(null);
  };

  const handleCancelEntry = () => {
    addDebugLog("Cancelling result entry");
    setEnteringResultForMatchId(null);
    setCurrentMatchResultInput(null);
    setSaveError(null);
  };

  const isValidSetScore = (scoreA: string, scoreB: string): boolean => {
    if (scoreA === "" || scoreB === "") return true;
    const a = parseInt(scoreA);
    const b = parseInt(scoreB);
    if (isNaN(a) || isNaN(b)) return false;
    if (a < 0 || a > 7 || b < 0 || b > 7) return false;
    if (a < 6 && b < 6) return false;
    if (a === 7 && b < 5) return false;
    if (b === 7 && a < 5) return false;
    return true;
  };

  const isValidTiebreakScore = (scoreA: string, scoreB: string): boolean => {
    if (scoreA === "" || scoreB === "") return true;
    const a = parseInt(scoreA);
    const b = parseInt(scoreB);
    if (isNaN(a) || isNaN(b)) return false;
    if (a < 0 || a > 30 || b < 0 || b > 30) return false;
    if ((a >= 10 || b >= 10) && Math.abs(a - b) < 2) return false;
    return true;
  };

  const handleSaveResult = async () => {
    if (enteringResultForMatchId === null || !currentMatchResultInput) {
      addDebugLog("No match selected or result data empty");
      setSaveError("Ingen kamp valgt eller resultatet er tomt");
      return;
    }

    const invalidSet = currentMatchResultInput.sets.find(
      (set) => !isValidSetScore(set.player1, set.player2)
    );
    if (invalidSet) {
      addDebugLog("Invalid set score detected", invalidSet);
      setSaveError(
        "Ugyldig set-score. Skal være maks. 7-5, og én spiller skal have mindst 6 point."
      );
      return;
    }

    if (
      currentMatchResultInput.tiebreak &&
      !isValidTiebreakScore(
        currentMatchResultInput.tiebreak.player1,
        currentMatchResultInput.tiebreak.player2
      )
    ) {
      addDebugLog(
        "Invalid tiebreak score detected",
        currentMatchResultInput.tiebreak
      );
      setSaveError(
        "Ugyldig tiebreak-score. Forskellen skal være mindst 2, hvis scoren er 10 eller højere."
      );
      return;
    }

    addDebugLog(
      `Saving result for match ${enteringResultForMatchId}`,
      currentMatchResultInput
    );

    try {
      const response = await api.post("SaveMatchResult", {
        matchId: enteringResultForMatchId,
        sets: currentMatchResultInput.sets,
        tiebreak: currentMatchResultInput.tiebreak,
      });
      addDebugLog(`Save successful`, response.data);

      const newScore: MatchScore = {
        FirstParticipantScore: parseInt(
          currentMatchResultInput.sets[currentMatchResultInput.sets.length - 1]
            .player1
        ),
        SecondParticipantScore: parseInt(
          currentMatchResultInput.sets[currentMatchResultInput.sets.length - 1]
            .player2
        ),
        LoserTiebreak: currentMatchResultInput.tiebreak
          ? parseInt(currentMatchResultInput.tiebreak.player1)
          : null,
        DetailedScoring: currentMatchResultInput.sets.map((set) => ({
          FirstParticipantScore: parseInt(set.player1),
          SecondParticipantScore: parseInt(set.player2),
          LoserTiebreak: null,
          DetailedScoring: null,
          IsFirstParticipantWinner:
            parseInt(set.player1) > parseInt(set.player2),
          LabelClass: "",
        })),
        IsFirstParticipantWinner:
          parseInt(
            currentMatchResultInput.sets[
              currentMatchResultInput.sets.length - 1
            ].player1
          ) >
          parseInt(
            currentMatchResultInput.sets[
              currentMatchResultInput.sets.length - 1
            ].player2
          ),
        LabelClass: "",
      };

      setMatches((prevMatches) =>
        prevMatches.map((match) =>
          match.matchId === enteringResultForMatchId
            ? {
                ...match,
                score: newScore,
                isPlayed: true,
              }
            : match
        )
      );
      setEnteringResultForMatchId(null);
      setCurrentMatchResultInput(null);
      setSaveError(null);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Kunne ikke gemme kampresultat";
      addDebugLog(`Save error`, { error: errorMessage });
      setSaveError(errorMessage);
    }
  };

  const toggleMatchExpand = (matchId: number) => {
    setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
    if (enteringResultForMatchId === matchId) {
      setEnteringResultForMatchId(null);
      setCurrentMatchResultInput(null);
      setSaveError(null);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white font-sans p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-primary mb-8 text-center animate-neon-glow">
            Indtast Kampresultater
          </h2>
          {userLoading ? (
            <div className="backdrop-blur-md bg-slate-900/30 border border-brand-secondary/50 rounded-xl p-6 text-center text-brand-secondary animate-pulse">
              <span className="inline-flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                  />
                </svg>
                Indlæser brugerinformation...
              </span>
            </div>
          ) : !isAuthenticated || user === null ? (
            <div className="backdrop-blur-md bg-red-950/20 border border-red-500/50 rounded-xl p-6 text-center text-red-400 shadow-[0_0_20px_rgba(255,0,0,0.3)]">
              🔒 Log venligst ind for at indtaste resultater.
            </div>
          ) : user.rankedInId === undefined || user.rankedInId === null ? (
            <div className="backdrop-blur-md bg-red-950/20 border border-red-500/50 rounded-xl p-6 text-center text-red-400 shadow-[0_0_20px_rgba(255,0,0,0.3)]">
              ❌ Dit RankedIn ID mangler. Kan ikke hente kvalificerede kampe.
            </div>
          ) : loadingMatches ? (
            <div className="backdrop-blur-md bg-slate-900/30 border border-brand-secondary/50 rounded-xl p-6 text-center text-brand-secondary animate-pulse">
              <span className="inline-flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                  />
                </svg>
                Indlæser kampe...
              </span>
            </div>
          ) : errorMatches ? (
            <div className="backdrop-blur-md bg-red-950/20 border border-red-500/50 rounded-xl p-6 text-center text-red-400 shadow-[0_0_20px_rgba(255,0,0,0.3)]">
              ❌ Fejl: {errorMatches}
            </div>
          ) : matches.length === 0 ? (
            <div className="backdrop-blur-md bg-slate-900/30 border border-brand-accent/50 rounded-xl p-6 text-center text-brand-accent">
              ✅ Ingen kvalificerede kampe fundet til resultatindtastning med
              dit RankedIn ID.
            </div>
          ) : (
            matches.map((match) => (
              <div
                key={match.matchId}
                className="backdrop-blur-md bg-slate-900/30 border border-brand-primary/30 rounded-xl p-4 sm:p-6 mb-6 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 animate-fadeIn"
              >
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleMatchExpand(match.matchId)}
                >
                  <h3 className="text-lg sm:text-xl font-bold text-brand-primary">
                    Kamp ID: {match.matchId} - {match.matchType} (Runde{" "}
                    {match.round})
                  </h3>
                  <svg
                    className={`w-6 h-6 transform transition-transform duration-300 ${
                      expandedMatchId === match.matchId ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {expandedMatchId === match.matchId && (
                  <div className="mt-4 animate-fadeIn">
                    <p className="text-gray-300 mb-2">
                      <span className="font-bold text-brand-secondary">
                        Bane:
                      </span>{" "}
                      {match.courtName || "Ikke angivet"}
                    </p>
                    <p className="text-gray-300 mb-2">
                      <span className="font-bold text-brand-secondary">
                        Dato:
                      </span>{" "}
                      {match.date
                        ? new Date(match.date).toLocaleString("da-DK")
                        : "Dato ikke angivet"}
                    </p>
                    <p className="text-gray-300 mb-2">
                      <span className="font-bold text-brand-secondary">
                        Udfordrer:
                      </span>{" "}
                      {match.challenger.firstPlayer.Name}{" "}
                      {match.challenger.secondPlayer &&
                        `& ${match.challenger.secondPlayer.Name}`}
                    </p>
                    <p className="text-gray-300 mb-4">
                      <span className="font-bold text-brand-secondary">
                        Udfordret:
                      </span>{" "}
                      {match.challenged.firstPlayer.Name}{" "}
                      {match.challenged.secondPlayer &&
                        `& ${match.challenged.secondPlayer.Name}`}
                    </p>

                    {match.score &&
                    match.isPlayed &&
                    enteringResultForMatchId !== match.matchId ? (
                      <div className="mt-4 backdrop-blur-md bg-slate-800/20 border border-brand-accent/30 rounded-lg p-4 shadow-[0_0_15px_rgba(166,76,235,0.3)]">
                        <h4 className="text-lg font-bold text-brand-primary mb-4 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-brand-accent"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Kampresultat
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {match.score.DetailedScoring?.map((set, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 hover:bg-slate-900/70 transition-all duration-200"
                            >
                              <span className="text-gray-200 font-semibold">
                                Sæt {index + 1}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-brand-primary font-bold text-lg">
                                  {set.FirstParticipantScore}
                                </span>
                                <span className="text-brand-accent">-</span>
                                <span className="text-brand-primary font-bold text-lg">
                                  {set.SecondParticipantScore}
                                </span>
                              </div>
                            </div>
                          ))}
                          {match.score.LoserTiebreak !== null && (
                            <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 hover:bg-slate-900/70 transition-all duration-200">
                              <span className="text-gray-200 font-semibold">
                                Tiebreak
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-brand-primary font-bold text-lg">
                                  {match.score.LoserTiebreak}
                                </span>
                                <span className="text-brand-accent">-</span>
                                <span className="text-brand-primary font-bold text-lg">
                                  {match.score.LoserTiebreak + 2}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : enteringResultForMatchId === match.matchId ? (
                      <div className="mt-4 backdrop-blur-md bg-slate-800/20 border border-brand-accent/30 rounded-lg p-4 shadow-[0_0_15px_rgba(166,76,235,0.3)]">
                        <h4 className="text-lg font-bold text-brand-primary mb-4 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-brand-accent"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                          Indtast resultat
                        </h4>
                        {saveError && (
                          <div className="backdrop-blur-md bg-red-950/20 border border-red-500/50 rounded-lg p-4 mb-4 text-red-400 flex items-center">
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {saveError}
                          </div>
                        )}
                        <div className="mb-4">
                          <div className="flex justify-between mb-2 text-sm text-gray-400">
                            <span>
                              {match.challenger.firstPlayer.Name}
                              {match.challenger.secondPlayer &&
                                ` & ${match.challenger.secondPlayer.Name}`}
                            </span>
                            <span>
                              {match.challenged.firstPlayer.Name}
                              {match.challenged.secondPlayer &&
                                ` & ${match.challenged.secondPlayer.Name}`}
                            </span>
                          </div>
                          {currentMatchResultInput?.sets.map(
                            (set, setIndex) => (
                              <div
                                key={setIndex}
                                className="flex items-center mb-3 space-x-2"
                              >
                                <span className="text-gray-300 min-w-[60px] font-semibold">
                                  Sæt {setIndex + 1}:
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="7"
                                  placeholder="0"
                                  value={set.player1}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const numValue = parseInt(value);
                                    if (
                                      value === "" ||
                                      (numValue >= 0 && numValue <= 7)
                                    ) {
                                      handleSetChange(
                                        setIndex,
                                        "player1",
                                        value
                                      );
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value &&
                                      (parseInt(value) < 0 ||
                                        parseInt(value) > 7)
                                    ) {
                                      handleSetChange(setIndex, "player1", "");
                                    }
                                  }}
                                  className={`w-16 p-2 bg-slate-900/50 border ${
                                    set.player1 &&
                                    set.player2 &&
                                    !isValidSetScore(set.player1, set.player2)
                                      ? "border-red-500 shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                                      : "border-brand-secondary/50 focus:border-brand-primary/80"
                                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-300 backdrop-blur-sm hover:bg-slate-900/70`}
                                />
                                <span className="text-brand-accent font-bold">
                                  -
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="7"
                                  placeholder="0"
                                  value={set.player2}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const numValue = parseInt(value);
                                    if (
                                      value === "" ||
                                      (numValue >= 0 && numValue <= 7)
                                    ) {
                                      handleSetChange(
                                        setIndex,
                                        "player2",
                                        value
                                      );
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value &&
                                      (parseInt(value) < 0 ||
                                        parseInt(value) > 7)
                                    ) {
                                      handleSetChange(setIndex, "player2", "");
                                    }
                                  }}
                                  className={`w-16 p-2 bg-slate-900/50 border ${
                                    set.player1 &&
                                    set.player2 &&
                                    !isValidSetScore(set.player1, set.player2)
                                      ? "border-red-500 shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                                      : "border-brand-secondary/50 focus:border-brand-primary/80"
                                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-300 backdrop-blur-sm hover:bg-slate-900/70`}
                                />
                                {set.player1 &&
                                  set.player2 &&
                                  isValidSetScore(set.player1, set.player2) &&
                                  set.player1 !== "" &&
                                  set.player2 !== "" && (
                                    <svg
                                      className="w-5 h-5 text-brand-accent"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                {set.player1 &&
                                  set.player2 &&
                                  !isValidSetScore(
                                    set.player1,
                                    set.player2
                                  ) && (
                                    <span className="ml-2 text-red-400 text-sm">
                                      Ugyldig score. Maks. 7-5, min. 6 point.
                                    </span>
                                  )}
                              </div>
                            )
                          )}
                        </div>
                        <button
                          onClick={addSet}
                          className="mt-2 px-4 py-2 bg-brand-accent/80 text-white font-bold rounded-lg hover:bg-brand-accent transition-all duration-300 shadow-[0_0_10px_rgba(166,76,235,0.5)] flex items-center"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Tilføj sæt
                        </button>

                        {currentMatchResultInput?.tiebreak !== undefined ? (
                          <div className="flex items-center mt-3 space-x-2">
                            <span className="text-gray-300 min-w-[60px] font-semibold">
                              Tiebreak:
                            </span>
                            <input
                              type="number"
                              min="0"
                              max="30"
                              placeholder="0"
                              value={
                                currentMatchResultInput?.tiebreak?.player1 || ""
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                const numValue = parseInt(value);
                                if (
                                  value === "" ||
                                  (numValue >= 0 && numValue <= 30)
                                ) {
                                  handleTiebreakChange("player1", value);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                if (
                                  value &&
                                  (parseInt(value) < 0 || parseInt(value) > 30)
                                ) {
                                  handleTiebreakChange("player1", "");
                                }
                              }}
                              className={`w-16 p-2 bg-slate-900/50 border ${
                                currentMatchResultInput?.tiebreak?.player1 &&
                                currentMatchResultInput?.tiebreak?.player2 &&
                                !isValidTiebreakScore(
                                  currentMatchResultInput.tiebreak.player1,
                                  currentMatchResultInput.tiebreak.player2
                                )
                                  ? "border-red-500 shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                                  : "border-brand-secondary/50 focus:border-brand-primary/80"
                              } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-300 backdrop-blur-sm hover:bg-slate-900/70`}
                            />
                            <span className="text-brand-accent font-bold">
                              -
                            </span>
                            <input
                              type="number"
                              min="0"
                              max="30"
                              placeholder="0"
                              value={
                                currentMatchResultInput?.tiebreak?.player2 || ""
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                const numValue = parseInt(value);
                                if (
                                  value === "" ||
                                  (numValue >= 0 && numValue <= 30)
                                ) {
                                  handleTiebreakChange("player2", value);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                if (
                                  value &&
                                  (parseInt(value) < 0 || parseInt(value) > 30)
                                ) {
                                  handleTiebreakChange("player2", "");
                                }
                              }}
                              className={`w-16 p-2 bg-slate-900/50 border ${
                                currentMatchResultInput?.tiebreak?.player1 &&
                                currentMatchResultInput?.tiebreak?.player2 &&
                                !isValidTiebreakScore(
                                  currentMatchResultInput.tiebreak.player1,
                                  currentMatchResultInput.tiebreak.player2
                                )
                                  ? "border-red-500 shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                                  : "border-brand-secondary/50 focus:border-brand-primary/80"
                              } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-300 backdrop-blur-sm hover:bg-slate-900/70`}
                            />
                            <button
                              onClick={toggleTiebreak}
                              className="ml-2 px-4 py-2 bg-red-500/80 text-white font-bold rounded-lg hover:bg-red-500 transition-all duration-300 shadow-[0_0_10px_rgba(255,0,0,0.5)] flex items-center"
                            >
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Fjern tiebreak
                            </button>
                            {currentMatchResultInput?.tiebreak?.player1 &&
                              currentMatchResultInput?.tiebreak?.player2 &&
                              isValidTiebreakScore(
                                currentMatchResultInput.tiebreak.player1,
                                currentMatchResultInput.tiebreak.player2
                              ) &&
                              currentMatchResultInput.tiebreak.player1 !== "" &&
                              currentMatchResultInput.tiebreak.player2 !==
                                "" && (
                                <svg
                                  className="w-5 h-5 text-brand-accent"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            {currentMatchResultInput?.tiebreak?.player1 &&
                              currentMatchResultInput?.tiebreak?.player2 &&
                              !isValidTiebreakScore(
                                currentMatchResultInput.tiebreak.player1,
                                currentMatchResultInput.tiebreak.player2
                              ) && (
                                <span className="ml-2 text-red-400 text-sm">
                                  Ugyldig tiebreak-score. Min. 2 point forskel
                                  ved 10+.
                                </span>
                              )}
                          </div>
                        ) : (
                          <button
                            onClick={toggleTiebreak}
                            className="mt-2 px-4 py-2 bg-brand-accent/80 text-white font-bold rounded-lg hover:bg-brand-accent transition-all duration-300 shadow-[0_0_10px_rgba(166,76,235,0.5)] flex items-center"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            Tilføj kamp tiebreak
                          </button>
                        )}

                        <div className="mt-4 flex space-x-4">
                          <button
                            onClick={handleSaveResult}
                            className="px-6 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-lg hover:bg-brand-primary/80 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Gem resultat
                          </button>
                          <button
                            onClick={handleCancelEntry}
                            className="px-6 py-2 bg-slate-800/50 text-white font-bold rounded-lg hover:bg-slate-800/80 transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.2)] flex items-center"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Annuller
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEnterResultClick(match)}
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-lg hover:bg-brand-primary/80 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                        Indtast resultat
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default EnterResultPage;
