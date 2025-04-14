import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { PadelMatch } from "../../types/PadelMatch.ts";
import communityApi from "../../services/makkerborsService.ts";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import { format } from "date-fns";
import da from "date-fns/locale/da";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export const MatchFinderAllMatchesTab = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState<PadelMatch[]>([]);
  const allMatches = matches;
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

      <div className="text-sm hover:bg-gray-700 cursor-pointer">
        {allMatches.map((match) => (
          <div
            onClick={() => navigate(`/makkerbørs/${match.id}`)}
            key={match.id}
            className="border p-4 rounded-lg space-y-1.5"
          >
            <h1 className="font-semibold">
              {format(
                new Date(match.matchDateTime),
                "EEEE | dd. MMMM | HH:MM",
                { locale: da }
              ).toUpperCase()}{" "}
              - 21:00
            </h1>
            <div className="flex justify-between border-b border-gray-600">
              <p>SMASH Padelcenter Horsens</p>
              <p>Herre</p>
            </div>
            <div className="flex justify-between">
              <p>Niveau {match.level} - 3.5</p>
              <div className="flex">
                {[
                  ...Array(
                    match.participants.length + match.reservedSpots.length
                  ),
                ].map((_, i) => (
                  <UserCircleIcon
                    key={`participant-${i}`}
                    className="h-5 text-cyan-500"
                  />
                ))}

                {[
                  ...Array(
                    4 - (match.participants.length + match.reservedSpots.length)
                  ),
                ].map((_, i) => (
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
