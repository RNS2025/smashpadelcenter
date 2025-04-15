import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { PadelMatch } from "../../types/PadelMatch";
import communityApi from "../../services/makkerborsService";
import LoadingSpinner from "../misc/LoadingSpinner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {toZonedTime} from "date-fns-tz";
import {registerLocale} from "react-datepicker";
import {da} from "date-fns/locale";
import MatchTextInfo from "./misc/MatchTextInfo";
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
      const zoned = toZonedTime(utcDate, "UTC");

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

  const getSpotCounts = (match: PadelMatch) => {
    const takenSpots = match.participants.length + match.reservedSpots.length + match.joinRequests.length;
    const availableSpots = match.totalSpots - takenSpots;
    return { takenSpots, availableSpots };
  };

  return (
    <>
      <Helmet>
        <title>Alle Kampe</title>
      </Helmet>

      <div className="text-sm cursor-pointer">
        {matches.map((match) => {
          const { takenSpots, availableSpots } = getSpotCounts(match);

          return (
              <div
                  onClick={() => navigate(`/makkerbørs/${match.id}`)}
                  key={match.id}
                  className="border p-4 rounded-lg space-y-1.5 hover:bg-gray-700 mb-5"
              >
                <h1 className="font-semibold">
                  {safeFormatDate(match.matchDateTime, "EEEE | dd. MMMM | HH:mm").toUpperCase()} - {match.endTime}
                </h1>
                <div className="flex justify-between border-b border-gray-600">
                  <p>{match.location}</p>
                  <p>{match.matchType}</p>
                </div>


                  <MatchTextInfo
                      level={match.level}
                      takenSpots={takenSpots}
                      availableSpots={availableSpots}
                      matchHost={match.username}
                  />
              </div>
          );
        })}

      </div>
    </>
  );
};

export default MatchFinderAllMatchesTab;
