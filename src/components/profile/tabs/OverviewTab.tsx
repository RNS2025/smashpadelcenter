import { Helmet } from "react-helmet-async";
import { useProfileContext } from "../../../context/ProfileContext";
import LoadingSpinner from "../../misc/LoadingSpinner";
import { safeFormatDate } from "../../../utils/dateUtils.ts";
import {
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import usePolling from "../../../hooks/usePolling.ts";
import communityApi from "../../../services/makkerborsService.ts";
import { PadelMatch } from "../../../types/PadelMatch.ts";
import {useNavigate} from "react-router-dom";

const OverviewTab = () => {
    const navigate = useNavigate();
  const { profile, matches, matchesLoading, setMatches } = useProfileContext();
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Polling for matches
  const fetchMatches = async () => {
    const allMatches = await communityApi.getMatches();
    const filteredMatches = allMatches.filter((match) => profile && match.participants.includes(profile.username) || profile && match.reservedSpots.map((reserved) => reserved.name).includes(profile.username));
    const upcoming = filteredMatches.filter((match: PadelMatch) => new Date(match.endTime) > new Date() && match.deadline && (new Date(match.deadline) > new Date()));
    const former = filteredMatches.filter((match) => match.participants.length === match.totalSpots)
        .filter((match: PadelMatch) => new Date(match.endTime) <= new Date());
    return { upcoming, former };
  };

  usePolling(
    fetchMatches,
    (matchData) => {
      setMatches(matchData);
    },
    {
      interval: 10000, // Poll every 10 seconds
      enabled: !!profile && isPageVisible,
    }
  );

  if (!profile) return <LoadingSpinner />;

  const winRate =
    profile.stats && profile.stats.matches
      ? Math.round((profile.stats.wins / profile.stats.matches) * 100)
      : 0;

  return (
    <>
      <Helmet>
        <title>Overblik</title>
      </Helmet>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
          Statistik
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              {profile.stats?.matches || 0}
            </p>
            <p className="text-xs text-gray-600">Kampe</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              {profile.stats?.wins || 0}
            </p>
            <p className="text-xs text-gray-600">Sejre</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              {profile.stats?.losses || 0}
            </p>
            <p className="text-xs text-gray-600">Nederlag</p>
          </div>
          <div className="col-span-3 mt-2">
            <div className="w-full bg-white rounded-full h-2.5">
              <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${winRate}%` }}>

              </div>
            </div>
            <p className="text-xs text-center mt-1 text-gray-600">
              {winRate}% Sejrsprocent
            </p>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
          Spilleroplysninger
        </h3>
        <p className="text-gray-800">
          <strong>Position:</strong> {profile.position}
        </p>
        <p className="text-gray-800">
          <strong>Spillestil:</strong> {profile.playingStyle}
        </p>
        <p className="text-gray-800">
          <strong>Udstyr:</strong> {profile.equipment}
        </p>

        <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
          Kommende Kampe
        </h3>

        {matchesLoading ? (
          <div className="py-4">
            <LoadingSpinner />
          </div>
        ) : matches.upcoming.length > 0 ? (
          <ul className="space-y-2">
            {matches.upcoming.slice(0, 2).map((match) => (
              <li
                  onClick={() => navigate(`/makkerbørs/${match.id}`)}
                key={match.id}
                className="border border-gray-900 p-2 rounded-lg text-gray-800"
              >
                <div className="flex justify-between text-xs border-b border-gray-600">
                  <h1>
                    {safeFormatDate(match.matchDateTime, "dd. MMMM | HH:mm").toUpperCase()} - {safeFormatDate(match.endTime, "HH:mm")}
                  </h1>
                  <div className="flex gap-1">
                    <p>
                      {match.location.includes("Horsens")
                        ? "Horsens"
                        : "Stensballe"}
                    </p>
                    <p>|</p>
                    <p>{match.matchType}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs pt-2">
                  <div className="flex items-center gap-2">
                    {match.participants.length !== match.totalSpots && (
                      <QuestionMarkCircleIcon className="size-8 text-gray-800" />
                    )}
                    <div>
                      <h1>Niveau:</h1>
                      <h1>{match.level}</h1>
                    </div>
                  </div>
                  <div className="max-w-44 grid grid-cols-2 gap-2 text-end">
                    {[
                      ...match.participants,
                      ...match.reservedSpots.map((reserved) => reserved.name),
                    ].map((name, index) => (
                      <p className="truncate text-center" key={index}>{name}</p>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
            <div className="border border-gray-900 p-2 rounded-lg text-gray-800">
              <p className="py-4 text-center text-gray-600">Ingen kommende kampe.</p>
            </div>
        )}
      </div>
    </>
  );
};

export default OverviewTab;
