import { useProfileContext } from "../../../context/ProfileContext.tsx";
import LoadingSpinner from "../../misc/LoadingSpinner.tsx";
import { Helmet } from "react-helmet-async";
import { safeFormatDate } from "../../../utils/dateUtils.ts";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

const MatchesTab = () => {
  const { profile, matches, matchesLoading } = useProfileContext();

  if (!profile)
    return (
      <div className="w-full flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );

  return (
    <>
      <Helmet>
        <title>Kamphistorik</title>
      </Helmet>

      {matchesLoading ? (
        <div className="w-full flex justify-center items-center">
          <LoadingSpinner />
        </div>
      ) : matches.former.length > 0 ? (
        <ul className="space-y-2">
          {matches.former.map((match) => {
            const allPlayersConfirmed = (() => {
              const totalParticipants = match.participants.length;
              if (totalParticipants === 2 || totalParticipants === 3) {
                return match.playersConfirmedResult.length === 2;
              }
              if (totalParticipants === 4) {
                return match.playersConfirmedResult.length >= 3;
              }
              return false;
            })();

            const isWinner = match.winningTeam?.includes(profile.username);
            const isDraw = match.winningTeam?.length === 0;

            return allPlayersConfirmed ? (
              <li
                key={match.id}
                className={`border-4 p-2 rounded-lg text-black ${
                  isWinner
                    ? "border-blue-500 bg-blue-100"
                    : isDraw
                    ? "bg-gray-100 border-gray-800"
                    : "bg-red-100 border-red-500"
                }`}
              >
                <div className="flex justify-between text-xs border-b border-gray-600">
                  <h1>
                    {safeFormatDate(
                      match.matchDateTime,
                      "dd. MMMM | HH:mm"
                    ).toUpperCase()}{" "}
                    - {safeFormatDate(match.endTime, "HH:mm")}
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
                <div className="flex justify-between text-xs pt-2 items-center">
                  <div className="flex items-center gap-4">
                    <div>
                      <h1>Niveau:</h1>
                      <h1>{match.level}</h1>
                    </div>
                  </div>
                  <div className="max-w-44 grid grid-cols-2 gap-2">
                    {[
                      ...match.participants,
                      ...match.reservedSpots.map((r) => r.name),
                    ].map((player, index) => (
                      <p className="text-center truncate" key={index}>
                        {player}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 mt-2 text-sm">
                  <h1 className="bg-blue-400 rounded-xl p-2 font-semibold">
                    {match.team1Sets} - {match.team2Sets}
                  </h1>
                  <h1>
                    (
                    {Object.values(match.score || {})
                      .filter((set) => set?.score)
                      .map((set) => set.score)
                      .join(", ")}
                    )
                  </h1>
                </div>
              </li>
            ) : (
              <li
                key={match.id}
                className="border p-2 rounded-lg border-slate-800/80 bg-slate-800/80 text-gray-300"
              >
                <div className="flex justify-between text-xs border-b border-gray-600">
                  <h1>
                    {safeFormatDate(
                      match.matchDateTime,
                      "dd. MMMM | HH:mm"
                    ).toUpperCase()}{" "}
                    - {safeFormatDate(match.endTime, "HH:mm")}
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
                <div className="flex justify-between text-xs pt-2 items-center">
                  <div className="flex items-center gap-4">
                    {!match.playersConfirmedResult.includes(
                      profile.username
                    ) && (
                      <QuestionMarkCircleIcon className="size-8 text-gray-300" />
                    )}
                    <div>
                      <h1>Niveau:</h1>
                      <h1>{match.level}</h1>
                    </div>
                  </div>
                  <div className="max-w-44 grid grid-cols-2 gap-2">
                    {[
                      ...match.participants,
                      ...match.reservedSpots.map((r) => r.name),
                    ].map((player, index) => (
                      <p className="text-center truncate" key={index}>
                        {player}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center mt-2">
                  <h1 className="text-sm italic text-gray-500">
                    Afventer bekræftelse af resultat
                  </h1>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="border p-2 rounded-lg text-gray-300">
          <p className="py-4 text-center">
            Ingen tidligere kampe.
          </p>
        </div>
      )}
    </>
  );
};

export default MatchesTab;
