import React from "react";
import Player from "../types/Player";

interface PlayerCheckInListProps {
  players: Player[];
  checkedInPlayers: Set<string>;
  loading: boolean;
  isCheckingIn: boolean;
  userRole: string;
  onCheckInToggle: (playerId: string, playerName: string) => void;
  onBulkCheckIn: (checkIn: boolean) => void;
  onPlayerClick: (playerId: string) => void; // New prop for navigation
}

const PlayerCheckInList: React.FC<PlayerCheckInListProps> = ({
  players,
  checkedInPlayers,
  loading,
  isCheckingIn,
  userRole,
  onCheckInToggle,
  onBulkCheckIn,
  onPlayerClick,
}) => {
  if (loading) {
    return <p>Loading players...</p>;
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Players</h2>
      {players.length === 0 ? (
        <p>No players found in this row.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {Array.from({ length: Math.ceil(players.length / 2) }).map((_, index) => {
              const player1 = players[index * 2];
              const player2 = players[index * 2 + 1];

              return (
                  <li
                      key={player1.RankedInId}
                      className="flex flex-col gap-4 p-4 bg-white shadow rounded-lg"
                  >
                    {[player1, player2].map(
                        (player) =>
                            player && (
                                <div key={player.RankedInId} className="flex justify-between items-center">
                                  <span className="text-blue-600 hover:underline cursor-pointer block" onClick={() => onPlayerClick(player.RankedInId)}>
                                    {player.Name}
                                  </span>

                                  <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={checkedInPlayers.has(player.RankedInId)}
                                        onChange={() =>
                                            onCheckInToggle(player.RankedInId, player.Name)
                                        }
                                        disabled={isCheckingIn}
                                        className="h-5 w-5 text-blue-600"
                                    />
                                    <span className="ml-2 text-gray-700">Checked In</span>
                                  </label>
                                </div>
                            ))}
                  </li>
              );
            })}

          </ul>
          {userRole === "admin" && (
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => onBulkCheckIn(true)}
                disabled={isCheckingIn}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Check In All
              </button>
              <button
                onClick={() => onBulkCheckIn(false)}
                disabled={isCheckingIn}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                Check Out All
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerCheckInList;
