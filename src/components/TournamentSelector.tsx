import React from "react";
import Tournament from "../types/Tournament";
import LoadingSpinner from "./LoadingSpinner";

type TournamentSelectorProps = {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  loading: boolean;
  onSelect: (tournament: Tournament) => void;
};

const TournamentSelector: React.FC<TournamentSelectorProps> = ({
  tournaments,
  selectedTournament,
  loading,
  onSelect,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTournaments = tournaments.filter(
    (tournament) => new Date(tournament.endDate) >= today
  );

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3">Select Tournament</h2>
      {loading ? (
        <div className="flex items-center text-gray-500">
          <LoadingSpinner />
          Loading tournaments...
        </div>
      ) : upcomingTournaments.length === 0 ? (
        <p className="text-gray-500">No upcoming tournaments available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingTournaments.map((tournament) => (
            <div
              key={tournament.eventId}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedTournament?.eventId === tournament.eventId
                  ? "bg-blue-100 border-blue-500"
                  : "bg-white hover:bg-gray-50"
              }`}
              onClick={() => onSelect(tournament)}
            >
              <h3 className="font-bold">{tournament.eventName}</h3>
              <p className="text-sm text-gray-600">
                {tournament.club}, {tournament.city}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(tournament.startDate).toLocaleDateString()} -
                {new Date(tournament.endDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentSelector;
