import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { PadelMatch } from "../../types/PadelMatch";
import communityApi from "../../services/makkerborsService";
import LoadingSpinner from "../misc/LoadingSpinner";
import { format } from "date-fns";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { registerLocale } from "react-datepicker";
import { da } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
registerLocale("da", da);

export const MatchFinderAwaitingTab = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const [matches, setMatches] = useState<PadelMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await communityApi.getMatches();
        const awaitingMatches = data.filter(
          (match) =>
            user?.username && match.joinRequests.includes(user?.username) && new Date(match.matchDateTime) >= new Date()
        ).sort((a, b) => {
            const aDate = new Date(a.matchDateTime).getTime();
            const bDate = new Date(b.matchDateTime).getTime();
            return aDate - bDate;
        });
        setMatches(awaitingMatches);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches");
        setLoading(false);
      }
    };
    fetchMatches().then();
  }, [user?.username]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const safeFormatDate = (dateString: string, formatString: string): string => {
    try {
      const utcDate = new Date(dateString);
      const zoned = toZonedTime(utcDate, "Europe/Copenhagen");

      return format(zoned, formatString, { locale: da });
    } catch {
      return "Ugyldig dato";
    }
  };

  return (
    <>
      <Helmet>
        <title>Afventer</title>
      </Helmet>

      <div className="text-sm ">
        {matches.length === 0 ? (
          <p className="mt-10">Ingen kampe afventer din bekræftelse.</p>
        ) : (
          matches.map((match) => (
            <div
              onClick={() => navigate(`/makkerbørs/${match.id}`)}
              key={match.id}
              className="border border-yellow-500 rounded-lg p-4 space-y-1.5 cursor-pointer hover:bg-gray-700 mb-5"
            >
              <h1 className="font-semibold">
                {safeFormatDate(
                  match.matchDateTime,
                  "EEEE | dd. MMMM | HH:mm"
                ).toUpperCase()}{" "}
                - {safeFormatDate(match.endTime, "HH:mm")}
              </h1>

              <div className="flex justify-between border-b border-gray-600">
                <p>{match.location}</p>
                <p>{match.matchType}</p>
              </div>

              <div className="flex justify-between">
                <p>Niveau {match.level}</p>
                <div className="flex items-center">
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
                      Math.max(
                        0,
                        match.totalSpots -
                          (match.participants.length +
                            match.reservedSpots.length)
                      )
                    ),
                  ]
                    .slice(0, match.joinRequests.length)
                    .map((_, i) => (
                      <UserCircleIcon
                        key={`join-${i}`}
                        className="h-5 text-yellow-500"
                      />
                    ))}

                  {[
                    ...Array(
                      Math.max(
                        0,
                        match.totalSpots -
                          (match.participants.length +
                            match.reservedSpots.length +
                            Math.min(
                              match.joinRequests.length,
                              match.totalSpots
                            ))
                      )
                    ),
                  ].map((_, i) => (
                    <UserCircleIcon
                      key={`empty-${i}`}
                      className="h-5 text-gray-500"
                    />
                  ))}

                  {match.joinRequests.length >
                    match.totalSpots -
                      (match.participants.length +
                        match.reservedSpots.length) && (
                    <div className="ml-1 text-xs text-yellow-400 font-semibold">
                      +
                      {match.joinRequests.length -
                        (match.totalSpots -
                          (match.participants.length +
                            match.reservedSpots.length))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-500">Oprettet af {match.username}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default MatchFinderAwaitingTab;
