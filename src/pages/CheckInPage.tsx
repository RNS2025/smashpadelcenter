import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Add useNavigate for navigation
import rankedInService from "../services/rankedIn";
import Player from "../types/Player";
import Tournament from "../types/Tournament";
import Row from "../types/Row";
import TournamentSelector from "../components/TournamentSelector";
import RowSelector from "../components/RowSelector";
import PlayerCheckInList from "../components/PlayerCheckInList";
import AlertMessage from "../components/AlertMessage";
import { useUser } from "../context/UserContext";

const RankedInPage = () => {
  const { role, error: authError, refreshUser } = useUser();
  const navigate = useNavigate(); // For programmatic navigation
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [checkedInPlayers, setCheckedInPlayers] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState({
    tournaments: false,
    rows: false,
    players: false,
    checkIn: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authError) {
      refreshUser();
    }
  }, [authError, refreshUser]);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading((prev) => ({ ...prev, tournaments: true }));
        const fetchedTournaments =
          await rankedInService.getAvailableTournaments();
        setTournaments(fetchedTournaments);
        if (fetchedTournaments.length > 0) {
          setSelectedTournament(fetchedTournaments[0]);
        }
      } catch (err) {
        setError("Error fetching tournaments.");
        console.error(err);
      } finally {
        setLoading((prev) => ({ ...prev, tournaments: false }));
      }
    };

    fetchTournaments();
  }, []);

  useEffect(() => {
    const fetchRows = async () => {
      if (!selectedTournament) return;

      try {
        setLoading((prev) => ({ ...prev, rows: true }));
        setPlayers([]);
        setSelectedRowId(null);

        const fetchedRows = await rankedInService.getAllRows(
          selectedTournament.eventId.toString()
        );
        setRows(fetchedRows);
      } catch (err) {
        setError("Error fetching rows.");
        console.error(err);
      } finally {
        setLoading((prev) => ({ ...prev, rows: false }));
      }
    };

    fetchRows();
  }, [selectedTournament]);

  useEffect(() => {
    const fetchPlayersWithCheckInStatus = async () => {
      if (!selectedTournament || !selectedRowId) return;

      try {
        setLoading((prev) => ({ ...prev, players: true }));
        const playersInRow = await rankedInService.getPlayersInRow({
          tournamentId: selectedTournament.eventId.toString(),
          tournamentClassId: selectedRowId,
          language: "en",
        });

        const checkInStatus = await rankedInService.getCheckInStatus(
          selectedTournament.eventId.toString(),
          selectedRowId
        );

        setPlayers(playersInRow);

        const checkedInSet = new Set<string>();
        checkInStatus.forEach((status) => {
          if (status.checkedIn) {
            checkedInSet.add(status.playerId);
          }
        });
        setCheckedInPlayers(checkedInSet);
      } catch (err) {
        setError("Error fetching players and check-in status.");
        console.error(err);
      } finally {
        setLoading((prev) => ({ ...prev, players: false }));
      }
    };

    fetchPlayersWithCheckInStatus();
  }, [selectedTournament, selectedRowId]);

  const handleTournamentSelect = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setSuccessMessage(null);
    setError(null);
  };

  const handleRowSelect = (rowId: string) => {
    setSelectedRowId(rowId);
    setSuccessMessage(null);
    setError(null);
  };

  const handleCheckInToggle = async (playerId: string, playerName: string) => {
    if (!selectedTournament || !selectedRowId) return;

    try {
      setLoading((prev) => ({ ...prev, checkIn: true }));

      const isCurrentlyCheckedIn = checkedInPlayers.has(playerId);
      const newCheckInStatus = !isCurrentlyCheckedIn;

      await rankedInService.updateCheckInStatus({
        tournamentId: selectedTournament.eventId.toString(),
        rowId: selectedRowId,
        playerId: playerId,
        playerName: playerName,
        checkedIn: newCheckInStatus,
      });

      setCheckedInPlayers((prev) => {
        const updated = new Set(prev);
        if (newCheckInStatus) {
          updated.add(playerId);
        } else {
          updated.delete(playerId);
        }
        return updated;
      });

      setSuccessMessage(
        `Successfully ${
          newCheckInStatus ? "checked in" : "checked out"
        } ${playerName}`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(`Failed to update check-in status for ${playerName}.`);
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, checkIn: false }));
    }
  };

  const handleBulkCheckIn = async (checkIn: boolean) => {
    if (
      !selectedTournament ||
      !selectedRowId ||
      players.length === 0 ||
      role !== "admin"
    )
      return;

    try {
      setLoading((prev) => ({ ...prev, checkIn: true }));

      await rankedInService.bulkUpdateCheckInStatus({
        tournamentId: selectedTournament.eventId.toString(),
        rowId: selectedRowId,
        checkedIn: checkIn,
        players: players.map((player) => ({
          playerId: player.RankedInId,
          playerName: player.Name,
        })),
      });

      const updatedSet = new Set<string>();
      if (checkIn) {
        players.forEach((player) => updatedSet.add(player.RankedInId));
      }
      setCheckedInPlayers(updatedSet);

      setSuccessMessage(
        `Successfully ${checkIn ? "checked in" : "checked out"} all players`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(`Failed to ${checkIn ? "check in" : "check out"} all players.`);
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, checkIn: false }));
    }
  };

  // Navigate to PlayerPage with playerId and tournamentClassId
  const handlePlayerClick = (playerId: string) => {
    if (selectedRowId) {
      navigate(`/player/${playerId}/${selectedRowId}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Tournament Check-In Management
      </h1>

      {error && (
        <AlertMessage
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {successMessage && (
        <AlertMessage
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      <TournamentSelector
        tournaments={tournaments}
        selectedTournament={selectedTournament}
        loading={loading.tournaments}
        onSelect={handleTournamentSelect}
      />

      {selectedTournament && (
        <RowSelector
          rows={rows}
          selectedRowId={selectedRowId}
          loading={loading.rows}
          onSelect={handleRowSelect}
        />
      )}

      {selectedRowId && (
        <PlayerCheckInList
          players={players}
          checkedInPlayers={checkedInPlayers}
          loading={loading.players}
          isCheckingIn={loading.checkIn}
          userRole={role!}
          onCheckInToggle={handleCheckInToggle}
          onBulkCheckIn={handleBulkCheckIn}
          onPlayerClick={handlePlayerClick} // Pass the new handler
        />
      )}
    </div>
  );
};

export default RankedInPage;
