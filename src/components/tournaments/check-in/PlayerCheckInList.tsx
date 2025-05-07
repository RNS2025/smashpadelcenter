import { FC } from "react";
import Player from "../../../types/Player.ts";

interface PlayerCheckInListProps {
  players: Player[];
  checkedInPlayers: Set<string>;
  loading: boolean;
  isCheckingIn: boolean;
  userRole: string;
  onCheckInToggle: (playerIds: string[], playerNames: string[]) => void;
  onBulkCheckIn: (checkIn: boolean) => void;
  onPlayerClick: (playerId: string) => void;
  tournamentNotToday: boolean;
}

const PlayerCheckInList: FC<PlayerCheckInListProps> = ({
  players,
  checkedInPlayers,
  loading,
  isCheckingIn,
  userRole,
  onCheckInToggle,
  onBulkCheckIn,
  onPlayerClick,
  tournamentNotToday,
}) => {
  if (loading) {
    return <p>Indlæser spillere...</p>;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between max-sm:mb-5">
        <h2 className="text-xl font-semibold mb-4">Spillere</h2>
        {tournamentNotToday && (
          <p className="text-gray-500 italic max-sm:text-right">
            Indtjekning åbner først på turneringsdagen.
          </p>
        )}
      </div>
      <div>
        {players.length > 0 && (
        <p className="text-gray-500 italic max-sm:text-center max-sm:text-sm">
          Klik på et spillernavn for at se mere information.
        </p>
        )}
      </div>
      {players.length === 0 ? (
        <p>Ingen spillere fundet i denne række.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {Array.from({ length: Math.ceil(players.length / 2) }).map(
              (_, index) => {
                const player1 = players[index * 2];
                const player2 = players[index * 2 + 1];

                // Create a unique key for the pair
                const key = player1
                  ? player2
                    ? `${player1.RankedInId}-${player2.RankedInId}` // Both players
                    : player1.RankedInId // Only player1
                  : `pair-${index}`; // Fallback (shouldn't happen)

                const bothCheckedIn =
                  player1 && player2
                    ? checkedInPlayers.has(player1.RankedInId) &&
                      checkedInPlayers.has(player2.RankedInId)
                    : false;

                return (
                  <li
                    key={key} // Use the combined key
                    className="flex flex-col gap-4 p-4 bg-white shadow rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-2">
                        {player1 && (
                          <span
                            className="text-gray-800 font-semibold cursor-pointer"
                            onClick={() => onPlayerClick(player1.RankedInId)}
                          >
                            {player1.Name}
                          </span>
                        )}
                        {player2 && (
                          <span
                            className="text-gray-800 font-semibold cursor-pointer"
                            onClick={() => onPlayerClick(player2.RankedInId)}
                          >
                            {player2.Name}
                          </span>
                        )}
                      </div>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={bothCheckedIn}
                          onChange={() => {
                            const playerIds = [
                              player1?.RankedInId,
                              player2?.RankedInId,
                            ].filter(Boolean) as string[];
                            const playerNames = [
                              player1?.Name,
                              player2?.Name,
                            ].filter(Boolean) as string[];
                            onCheckInToggle(playerIds, playerNames);
                          }}
                          disabled={isCheckingIn || tournamentNotToday}
                          className="h-5 w-5 text-cyan-500"
                        />
                        <span className="ml-2 text-gray-700">Tjek ind</span>
                      </label>
                    </div>
                  </li>
                );
              }
            )}
          </ul>

          {userRole === "admin" && (
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => onBulkCheckIn(false)}
                disabled={isCheckingIn || tournamentNotToday}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
              >
                Udtjek alle
              </button>
              <button
                onClick={() => onBulkCheckIn(true)}
                disabled={isCheckingIn || tournamentNotToday}
                className="px-4 py-2 bg-cyan-500 text-white rounded disabled:bg-gray-400"
              >
                Indtjek alle
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerCheckInList;
