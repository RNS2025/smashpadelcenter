import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import rankedInService from "../services/rankedIn";
import Match from "../types/Match";
import PlayerData from "../types/PlayerData";

const PlayerPage = () => {
  const { playerId, tournamentClassId } = useParams<{
    playerId: string;
    tournamentClassId: string;
  }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!playerId || !tournamentClassId) {
        setError("Missing player ID or tournament class ID.");
        setLoading(false);
        return;
      }

      try {
        const playerMatches = await rankedInService.getPlayerMatches({
          playerId,
          rowId: tournamentClassId,
          language: "en",
        });
        setMatches(playerMatches);

        const playerDetails = await rankedInService.getPlayerDetails(playerId);
        setPlayerData(playerDetails);
      } catch (err) {
        setError("Failed to fetch data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerId, tournamentClassId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Loading matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-red-500 text-lg font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Player Profile Section */}
      {playerData?.Header && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {playerData.Header.ImageThumbnailUrl && (
              <img
                src={playerData.Header.ImageThumbnailUrl}
                alt={`${playerData.Header.FullName}'s profile`}
                className="w-32 h-32 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {playerData.Header.FullName}
              </h1>
              <div className="space-y-1 text-gray-600">
                <p>
                  <strong>RankedIn ID:</strong> {playerData.Header.RankedinId}
                </p>
                {playerData.Header.HomeClubName && (
                  <p>
                    <strong>Home Club:</strong>{" "}
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
                    <strong>Country:</strong>{" "}
                    {playerData.Header.CountryShort.toUpperCase()}
                  </p>
                )}
                {playerData.Header.Age && (
                  <p>
                    <strong>Age:</strong> {playerData.Header.Age}
                  </p>
                )}
                {playerData.Header.Form && (
                  <p>
                    <strong>Recent Form:</strong>{" "}
                    {playerData.Header.Form.join(" ") || "No recent matches"}
                  </p>
                )}
                {playerData.Header.IsProPlayer && (
                  <p className="text-green-600 font-semibold">
                    Professional Player
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          {playerData.Statistics && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Current Year Stats
                </h3>
                <p>
                  <strong>Doubles W-L:</strong>{" "}
                  {playerData.Statistics.WinLossDoublesCurrentYear}
                </p>
                <p>
                  <strong>Doubles Events:</strong>{" "}
                  {playerData.Statistics.EventsParticipatedDoublesCurrentYear}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Career Stats
                </h3>
                <p>
                  <strong>Doubles W-L:</strong>{" "}
                  {playerData.Statistics.CareerWinLossDoubles}
                </p>
                <p>
                  <strong>Doubles Events:</strong>{" "}
                  {playerData.Statistics.CareerEventsParticipatedDoubles}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Matches Section */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Matches for {playerData?.Header?.FullName || "Player"}
      </h2>
      {matches.length === 0 ? (
        <p className="text-gray-600 text-lg">
          No matches found for this player.
        </p>
      ) : (
        <div className="grid gap-6">
          {matches.map((match) => (
            <div
              key={match.matchId}
              className="bg-white shadow-md rounded-lg p-5 border border-gray-200 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {match.matchType} - Round {match.round}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    match.isPlayed
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {match.isPlayed ? "Played" : "Upcoming"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">
                    <strong>Challenger:</strong>{" "}
                    {match.challenger.firstPlayer.Name}
                    {match.challenger.secondPlayer
                      ? ` & ${match.challenger.secondPlayer.Name}`
                      : ""}
                  </p>
                  <p className="text-gray-600">
                    <strong>Challenged:</strong>{" "}
                    {match.challenged.firstPlayer.Name}
                    {match.challenged.secondPlayer
                      ? ` & ${match.challenged.secondPlayer.Name}`
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">
                    <strong>Date:</strong>{" "}
                    {match.date
                      ? new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(match.date))
                      : "TBD"}
                  </p>
                  <p className="text-gray-600">
                    <strong>Court:</strong> {match.courtName || "Not assigned"}
                  </p>
                  <p className="text-gray-600">
                    <strong>Duration:</strong>{" "}
                    {match.durationMinutes
                      ? `${match.durationMinutes} minutes`
                      : "Not set"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-gray-700">
                  <strong>Score:</strong> {match.score || "Not played yet"}
                </p>
                {match.winnerParticipantId && (
                  <p className="text-gray-700">
                    <strong>Winner:</strong>{" "}
                    {match.winnerParticipantId ===
                    match.challenger.firstPlayer.Id
                      ? match.challenger.firstPlayer.Name
                      : match.challenged.firstPlayer.Name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerPage;
