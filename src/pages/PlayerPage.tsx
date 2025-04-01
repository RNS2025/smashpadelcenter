import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import rankedInService from "../services/rankedIn";
import Match from "../types/Match";

const PlayerPage = () => {
  const { playerId, tournamentClassId } = useParams<{
    playerId: string;
    tournamentClassId: string;
  }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
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
      } catch (err) {
        setError("Failed to fetch matches.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Matches for Player {playerId} (Tournament Class {tournamentClassId})
      </h1>
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
