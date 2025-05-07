import {FC} from "react";
import Tournament from "../../../types/Tournament.ts";
import LoadingSpinner from "../../misc/LoadingSpinner.tsx";
import { format } from "date-fns";
import {registerLocale} from "react-datepicker";
import {da} from "date-fns/locale";
registerLocale("da", da);

type TournamentSelectorProps = {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  loading: boolean;
  onSelect: (tournament: Tournament) => void;
};

const TournamentSelector: FC<TournamentSelectorProps> = ({
  tournaments,
  selectedTournament,
  loading,
  onSelect,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filtrerer på kun at finde næste turnering
  const upcomingTournament = tournaments.find(
      (tournament) => new Date(tournament.endDate) >= today
  );

  return (
    <div className="mb-6">
      {loading ? (
          <div className="flex items-center text-gray-500">
            <LoadingSpinner />
            Indlæser turneringer...
          </div>
      ) : !upcomingTournament ? (
          <p className="text-gray-500">Ingen kommende turneringer tilgængelige.</p>
      ) : (
            <div
                key={upcomingTournament.eventId}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTournament?.eventId === upcomingTournament.eventId
                        ? "border-cyan-500"
                        : ""
                }`}
                onClick={() => onSelect(upcomingTournament)}
            >
              <h3 className="font-bold">{upcomingTournament.eventName}</h3>
              <p className="text-gray-400">
                {upcomingTournament.club}
              </p>
              <p className="text-gray-400">
                {format(new Date(upcomingTournament.startDate), "dd. MMMM yyyy", { locale: da })}
              </p>
            </div>
      )}

    </div>
  );
};

export default TournamentSelector;
