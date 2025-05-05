import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import rankedInService from "../../services/rankedIn.ts";
import Match from "../../types/Match.ts";
import PlayerData from "../../types/PlayerData.ts";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import Animation from "../../components/misc/Animation.tsx";
import HomeBar from "../../components/misc/HomeBar.tsx";

const PlayerPage = () => {
  const { playerId, rowId } = useParams<{
    playerId: string;
    rowId: string;
  }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!playerId || !rowId) {
        setError("Spiller-ID eller turneringsklasse-ID mangler.");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching player data for:", { playerId, rowId });
        const playerMatches = await rankedInService.getPlayerMatches({
          playerId,
          rowId: rowId,
          language: "da",
        });
        console.log("Player matches:", playerMatches);
        setMatches(playerMatches);

        const playerDetails = await rankedInService.getPlayerDetails(
          playerId,
          "da"
        );
        console.log("Player details:", playerDetails);
        setPlayerData(playerDetails);
      } catch (err) {
        setError("Kunne ikke hente spillerdata.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerId, rowId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Indlæser kampe...</p>
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-red-500 text-lg font-semibold">
          {error || "Ingen spillerdata fundet."}
        </p>
      </div>
    );
  }

  return (
    <>
      <Animation>
        <HomeBar />
        <div className="mx-auto p-6 max-w-4xl">
          {/* Player Profile Section */}
          {playerData.Header && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {playerData.Header.ImageThumbnailUrl && (
                  <img
                    src={playerData.Header.ImageThumbnailUrl}
                    alt={`${playerData.Header.FullName}'s profil`}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {playerData.Header.FullName || "Ukendt spiller"}
                  </h1>
                  <div className="space-y-1 text-gray-600">
                    <p>
                      <strong>RankedIn ID:</strong>{" "}
                      {playerData.Header.RankedinId}
                    </p>
                    {playerData.Header.HomeClubName && (
                      <p>
                        <strong>Klub:</strong>{" "}
                        <a
                          href={playerData.Header.HomeClubUrl || "#"}
                          className="text-blue-500 hover:underline"
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
                    playerData.Header.Form.length > 0 ? (
                      <p>
                        <strong>Seneste form:</strong>{" "}
                        {playerData.Header.Form.map(
                          (result: string, index: number) => (
                            <span
                              key={index}
                              className={
                                result === "W"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {result}{" "}
                            </span>
                          )
                        )}
                      </p>
                    ) : (
                      <p>
                        <strong>Seneste form:</strong> Ingen kampe at vise
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics Section */}
              {playerData.Statistics && (
                <div className="mt-6 flex max-sm:flex-col md:justify-center md:space-x-44 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Statistik for {new Date().getFullYear()}
                    </h3>
                    <p className="text-gray-800">
                      <strong>Doubles W-L:</strong>{" "}
                      {playerData.Statistics.WinLossDoublesCurrentYear}
                    </p>
                    <p className="text-gray-800">
                      <strong>Doubles Events:</strong>{" "}
                      {
                        playerData.Statistics
                          .EventsParticipatedDoublesCurrentYear
                      }
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Karrierestatistik
                    </h3>
                    <p className="text-gray-800">
                      <strong>Doubles W-L:</strong>{" "}
                      {playerData.Statistics.CareerWinLossDoubles}
                    </p>
                    <p className="text-gray-800">
                      <strong>Doubles Events:</strong>{" "}
                      {playerData.Statistics.CareerEventsParticipatedDoubles}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Matches Section */}
          <h2 className="text-2xl font-bold mb-6">
            Kampe for {playerData.Header?.FullName || "spiller"}
          </h2>
          {matches.length === 0 ? (
            <p className="text-lg">Ingen kampe fundet for spiller.</p>
          ) : (
            <div className="grid gap-6 text-black-800">
              {matches.map((match) => (
                <div
                  key={match.matchId}
                  className="bg-white shadow-md rounded-lg p-5 border border-gray-200 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {match.matchType.replace(/([a-z])([A-Z])/g, "$1 $2")}{" "}
                      {match.matchType !== "RoundRobin"
                        ? `- Runde ${match.round}`
                        : ""}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        match.isPlayed
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {match.isPlayed ? "Afviklet" : "Kommende"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p
                        className={`text-gray-800 ${
                          match.isPlayed &&
                          match.score?.IsFirstParticipantWinner
                            ? "font-bold"
                            : ""
                        }`}
                      >
                        <strong>Udfordrere:</strong>{" "}
                        {match.challenger.firstPlayer.Name}
                        {match.challenger.secondPlayer
                          ? ` & ${match.challenger.secondPlayer.Name}`
                          : ""}
                        {match.isPlayed &&
                          match.score?.IsFirstParticipantWinner && (
                            <span className="ml-2 text-green-600">🏆</span>
                          )}
                      </p>
                      <p
                        className={`text-gray-800 ${
                          match.isPlayed &&
                          !match.score?.IsFirstParticipantWinner
                            ? "font-bold"
                            : ""
                        }`}
                      >
                        <strong>Modstanderpar:</strong>{" "}
                        {match.challenged.firstPlayer.Name}
                        {match.challenged.secondPlayer
                          ? ` & ${match.challenged.secondPlayer.Name}`
                          : ""}
                        {match.isPlayed &&
                          !match.score?.IsFirstParticipantWinner && (
                            <span className="ml-2 text-green-600">🏆</span>
                          )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-800">
                        <strong>Tidspunkt:</strong>{" "}
                        {match.date
                          ? format(
                              new Date(match.date),
                              "dd. MMMM yyyy - HH:mm",
                              {
                                locale: da,
                              }
                            )
                          : "TBD"}
                      </p>
                      <p className="text-gray-800">
                        <strong>Bane:</strong>{" "}
                        {match.courtName || "Ikke tildelt"}
                      </p>
                      <p className="text-gray-800">
                        <strong>Varighed:</strong>{" "}
                        {match.durationMinutes
                          ? `${match.durationMinutes} minutter`
                          : "Ikke sat"}
                      </p>
                    </div>
                  </div>

                  {/* Score Section */}
                  {match.isPlayed && match.score && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h3 className="font-semibold text-lg mb-2">Resultat</h3>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div>
                          <p className="font-medium">
                            Samlet score:
                            <span className="ml-2 text-lg">
                              {match.score.FirstParticipantScore} -{" "}
                              {match.score.SecondParticipantScore}
                            </span>
                          </p>
                        </div>

                        {match.score.DetailedScoring && (
                          <div>
                            <p className="font-medium">Set:</p>
                            <div className="flex gap-2 flex-wrap">
                              {match.score.DetailedScoring.map((set, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-100 px-3 py-1 rounded-md"
                                >
                                  {set.FirstParticipantScore}-
                                  {set.SecondParticipantScore}
                                </span>
                              ))}
                            </div>
                          </div>
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
    </>
  );
};

export default PlayerPage;
