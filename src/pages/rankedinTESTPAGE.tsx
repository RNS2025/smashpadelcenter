import React, { useEffect, useState } from "react";
import rankedInService from "../services/rankedIn"; // Assuming the service file is correctly imported
import Player from "../types/Player";
import Tournament from "../types/Tournament";

const RankedInTestPage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tournaments and players
  const fetchTournamentData = async () => {
    try {
      setLoading(true); // Set loading to true while fetching
      // Get all available tournaments
      const fetchedTournaments =
        await rankedInService.getAvailableTournaments();
      // Set tournaments to state
      setTournaments(fetchedTournaments);
    } catch (err) {
      setError("Error fetching tournaments.");
      console.error(err);
    } finally {
      setLoading(false); // Set loading to false after the request
    }
  };

  useEffect(() => {
    fetchTournamentData(); // Fetch data when the component mounts
  }, []); // Empty dependency array ensures the effect only runs once when the component mounts

  return (
    <div>
      <h1>Ranked In Test Page</h1>

      {loading && <p>Loading tournaments...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && tournaments.length === 0 && (
        <p>No tournaments available.</p>
      )}

      {!loading && !error && tournaments.length > 0 && (
        <div>
          {tournaments.map((tournament) => (
            <div key={tournament.eventId} style={{ marginBottom: "20px" }}>
              <h2>{tournament.eventName}</h2>
              <p>
                <strong>Club:</strong> {tournament.club}
              </p>
              <p>
                <strong>City:</strong> {tournament.city}
              </p>
              <p>
                <strong>Start Date:</strong>{" "}
                {new Date(tournament.startDate).toLocaleString()}
              </p>
              <p>
                <strong>End Date:</strong>{" "}
                {new Date(tournament.endDate).toLocaleString()}
              </p>

              {/* Display players for this tournament */}
              <TournamentPlayers tournamentId={tournament.eventId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Component to fetch and display players for each tournament
const TournamentPlayers = ({ tournamentId }: { tournamentId: number }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true); // Set loading to true while fetching
      const rows = await rankedInService.getAllRows(tournamentId.toString());

      const playersData: Player[] = [];
      for (const row of rows) {
        const playersInRow = await rankedInService.getPlayersInRow({
          tournamentId: tournamentId.toString(),
          tournamentClassId: row.Id.toString(),
          language: "en",
        });
        playersData.push(...playersInRow); // Adding players from each row
      }
      setPlayers(playersData);
    } catch (err) {
      setError("Error fetching players.");
      console.error(err);
    } finally {
      setLoading(false); // Set loading to false after the request
    }
  };

  useEffect(() => {
    fetchPlayers(); // Fetch players when the component mounts or when `tournamentId` changes
  }, [tournamentId]); // Re-fetch players when `tournamentId` changes

  return (
    <div>
      {loading && <p>Loading players...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && players.length === 0 && (
        <p>No players available for this tournament.</p>
      )}

      {!loading && players.length > 0 && (
        <div>
          <h3>Players:</h3>
          <ul>
            {players.map((player) => (
              <li key={player.RankedInId}>{player.Name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RankedInTestPage;
