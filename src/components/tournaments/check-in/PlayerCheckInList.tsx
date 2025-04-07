import React from "react";
import Player from "../../../types/Player.ts";

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
    return <p>Indlæser spillere...</p>;
  }

  return (

    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Spillere</h2>
      {players.length === 0 ? (
        <p>Ingen spillere fundet i denne række.</p>
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
                                  <span className="text-gray-800 font-semibold hover:underline cursor-pointer block" onClick={() => onPlayerClick(player.RankedInId)}>
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
                                        className="h-5 w-5 text-cyan-500"
                                    />
                                    <span className="ml-2 text-gray-700">Tjek ind</span>
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
                className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Indtjek alle
              </button>
              <button
                onClick={() => onBulkCheckIn(false)}
                disabled={isCheckingIn}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                Udtjek alle
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerCheckInList;
