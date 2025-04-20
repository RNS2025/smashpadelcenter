import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { PadelMatch } from "../../types/PadelMatch";
import communityApi from "../../services/makkerborsService";
import LoadingSpinner from "../misc/LoadingSpinner";
import { format } from "date-fns";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { toZonedTime } from "date-fns-tz";
import { registerLocale } from "react-datepicker";
import { da } from "date-fns/locale";
registerLocale("da", da);

export const MatchFinderAllMatchesTab = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState<PadelMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await communityApi.getMatches();
        setMatches(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches");
        setLoading(false);
      }
    };
    fetchMatches().then();
  }, []);

  const safeFormatDate = (dateString: string, formatString: string): string => {
    try {
      const utcDate = new Date(dateString);
      const zoned = toZonedTime(utcDate, "Europe/Copenhagen");

      return format(zoned, formatString, { locale: da });
    } catch {
      return "Ugyldig dato";
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
      <Helmet>
        <title>Alle Kampe</title>
      </Helmet>

      <div className="text-sm cursor-pointer">
        {matches.map((match) => (
          <div
            onClick={() => navigate(`/makkerbørs/${match.id}`)}
            key={match.id}
            className="border p-4 rounded-lg space-y-1.5 hover:bg-gray-700 mb-5"
          >
            <h1 className="font-semibold">
              {safeFormatDate(match.matchDateTime, "EEEE | dd. MMMM | HH:mm").toUpperCase()} - {safeFormatDate(match.endTime, "HH:mm")}
            </h1>
            <div className="flex justify-between border-b border-gray-600">
              <p>{match.location}</p>
              <p>Herre</p>
            </div>
            <div className="flex justify-between">
              <p>Niveau {match.level}</p>
              <div className="flex">
                {[...Array(match.participants.length + match.reservedSpots.length),].map((_, i) => (
                    <UserCircleIcon
                        key={`participant-${i}`}
                        className="h-5 text-cyan-500"
                    />
                ))}
                {[...Array(match.joinRequests.length),].map((_, i) => (
                    <UserCircleIcon
                        key={`empty-${i}`}
                        className="h-5 text-yellow-500"
                    />
                ))}
                {[...Array(match.totalSpots - (match.participants.length + match.reservedSpots.length + match.joinRequests.length)),].map((_, i) => (
                    <UserCircleIcon
                        key={`empty-${i}`}
                        className="h-5 text-gray-500"
                    />
                ))}
              </div>
            </div>
            <p className="text-gray-500">Oprettet af {match.username}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default MatchFinderAllMatchesTab;
