import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { PadelMatch } from "../../types/PadelMatch";
import communityApi from "../../services/makkerborsService";
import LoadingSpinner from "../misc/LoadingSpinner";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useNavigate, useOutletContext } from "react-router-dom";
import { registerLocale } from "react-datepicker";
import { da } from "date-fns/locale";
import { useUser } from "../../context/UserContext.tsx";
import {
  calculateTimeDifference,
  safeFormatDate,
} from "../../utils/dateUtils.ts";
registerLocale("da", da);

type OutletContextType = {
  showFullMatches: boolean;
  isMyLevel: boolean;
};

export const MatchFinderAllMatchesTab = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { showFullMatches, isMyLevel } = useOutletContext<OutletContextType>();
  const [matches, setMatches] = useState<PadelMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await communityApi.getMatches();

        const now = new Date();

        const sortedData = data
          .filter((match) => {
            const matchDate = new Date(
              match.deadline ? match.deadline : match.matchDateTime
            );
            return matchDate >= now;
          })
          .filter((match) => {
            if (user) {
              return !match.participants.includes(user?.username);
            }
          })
          .sort((a, b) => {
            const aDate = new Date(a.matchDateTime).getTime();
            const bDate = new Date(b.matchDateTime).getTime();
            return aDate - bDate;
          });

        setMatches(sortedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches");
        setLoading(false);
      }
    };

    fetchMatches().then();
  }, [user]);

  if (loading) {
    return (
      <>
        <div className="w-full flex justify-center items-center">
          <LoadingSpinner />
        </div>
      </>
    );
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
        {matches.length === 0 ? (
          <div className="border p-4 rounded-lg space-y-1.5 mb-5">
            <p className="text-center py-4 font-semibold">
              Ingen aktuelle kampe at vise.
            </p>
          </div>
        ) : (
          matches
            .filter((match) => {
              const isFull =
                match.participants.length + match.reservedSpots.length ===
                match.totalSpots;
              if (!showFullMatches && isFull) return false;
              if (isMyLevel && user?.skillLevel) {
                const [minLevel, maxLevel] = match.level
                  .split(" - ")
                  .map(Number);
                const userLevel = Number(user.skillLevel);
                const matchesMyLevel =
                  userLevel >= minLevel && userLevel <= maxLevel;

                if (!matchesMyLevel) return false;
              }

              return true;
            })
            .map((match) => (
              <div
                onClick={() => navigate(`/makkerbørs/match/${match.id}`)}
                key={match.id}
                className={`border p-4 rounded-lg space-y-1.5 mb-5 ${
                  match.participants.length + match.reservedSpots.length ===
                  match.totalSpots
                    ? "opacity-70 border-red-500"
                    : ""
                }
            ${
              user?.username && match.joinRequests.includes(user?.username)
                ? "border-yellow-500"
                : ""
            }`}
              >
                <h1 className="font-semibold">
                  {safeFormatDate(
                    match.matchDateTime,
                    "EEEE | dd. MMMM | HH:mm"
                  ).toUpperCase()}{" "}
                  - {safeFormatDate(match.endTime, "HH:mm")}
                </h1>
                {match.deadline && (
                  <h1 className="text-gray-500 italic">
                    Deadline:{" "}
                    {calculateTimeDifference(
                      match.matchDateTime,
                      match.deadline
                    ).hours > 1
                      ? `${
                          calculateTimeDifference(
                            match.matchDateTime,
                            match.deadline
                          ).hours
                        } timer før`
                      : `${
                          calculateTimeDifference(
                            match.matchDateTime,
                            match.deadline
                          ).hours
                        } time før`}
                  </h1>
                )}
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
                <p className="text-gray-500">
                  Oprettet af{" "}
                  {match.username === user?.username
                    ? "dig"
                    : `${match.username}`}
                </p>
              </div>
            ))
        )}
      </div>
    </>
  );
};

export default MatchFinderAllMatchesTab;
