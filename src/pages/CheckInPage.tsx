import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import rankedInService from "../services/rankedIn";
import Player from "../types/Player";
import Tournament from "../types/Tournament";
import Row from "../types/Row";
import TournamentSelector from "../components/tournaments/check-in/TournamentSelector.tsx";
import RowSelector from "../components/tournaments/check-in/RowSelector.tsx";
import PlayerCheckInList from "../components/tournaments/check-in/PlayerCheckInList.tsx";
import AlertMessage from "../components/tournaments/check-in/AlertMessage.tsx";
import { useUser } from "../context/UserContext";
import Animation from "../components/misc/Animation.tsx";
import HomeBar from "../components/misc/HomeBar.tsx";

const CheckInPage = () => {
  const { role, error: authError, refreshUser, username } = useUser();
  const navigate = useNavigate(); // For programmatic navigation
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
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
  const [successType, setSuccessType] = useState<"success" | "error">("success");

  useEffect(() => {
    if (authError) {
      refreshUser().then();
    }
  }, [authError, refreshUser]);

  // TODO: Måske lave dette om til et hook?
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

    fetchTournaments().then();
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

    fetchRows().then();
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

    fetchPlayersWithCheckInStatus().then();
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

  const handleCheckInToggle = async (playerIds: string[], playerNames: string[]) => {
    if (!selectedTournament || !selectedRowId) return;

    try {
      setLoading((prev) => ({ ...prev, checkIn: true }));

      const newCheckInStatus = !checkedInPlayers.has(playerIds[0]); // Antag begge har samme status

      await Promise.all(
          playerIds.map((id, i) =>
              rankedInService.updateCheckInStatus({
                tournamentId: selectedTournament.eventId.toString(),
                rowId: selectedRowId,
                playerId: id,
                playerName: playerNames[i],
                checkedIn: newCheckInStatus,
                userId: username || "Unknown",
              })
          )
      );

      setCheckedInPlayers((prev) => {
        const updated = new Set(prev);
        playerIds.forEach((id) =>
            newCheckInStatus ? updated.add(id) : updated.delete(id)
        );
        return updated;
      });

      setSuccessType(newCheckInStatus ? "success" : "error");
      setSuccessMessage(`${playerNames.join(" & ")} ${newCheckInStatus ? "er nu tjekket ind" : "er nu tjekket ud"}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(`Failed to update check-in for ${playerNames.join(" & ")}.`);
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

      //TODO: Metoden virker ikke efter at have sat makkerparrets indtjekning sammen
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

      setSuccessType(checkIn ? "success" : "error");
      setSuccessMessage(
        `Alle spillere markeret som ${checkIn ? "tjekket ind" : "tjekket ud"}`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
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
    <>
      <Animation>
        <HomeBar/>

        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">
            Indtjekning for kommende turneringer
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
              type={successType}
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
              tournamentNotToday={selectedTournament?.startDate !== new Date().toISOString()}
              onCheckInToggle={handleCheckInToggle}
              onBulkCheckIn={handleBulkCheckIn}
              onPlayerClick={handlePlayerClick} // Pass the new handler
            />
          )}
        </div>
      </Animation>
    </>
  );
};

export default CheckInPage;
