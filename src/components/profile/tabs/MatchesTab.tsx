import {useProfileContext} from "../../../context/ProfileContext.tsx";
import LoadingSpinner from "../../misc/LoadingSpinner.tsx";
import {Helmet} from "react-helmet-async";
import {safeFormatDate} from "../../../utils/dateUtils.ts";
import {CheckCircleIcon, QuestionMarkCircleIcon} from "@heroicons/react/24/outline";

const MatchesTab = () => {
    const { profile, matches, matchesLoading } = useProfileContext();


    if (!profile) return <LoadingSpinner />;
  return (
      <>
        <Helmet>
          <title>Kamphistorik</title>
        </Helmet>

        {matchesLoading ? (
            <div className="py-4">
              <LoadingSpinner />
            </div>
        ) : matches.former.length > 0 ? (
            <ul className="space-y-2">
              {matches.former.map((match) => (
                  <li
                      key={match.id}
                      className="border border-gray-900 p-2 rounded-lg text-gray-800"
                  >
                    <div className="flex justify-between text-xs border-b border-gray-600">
                      <h1>
                        {safeFormatDate(
                            match.matchDateTime,
                            "dd. MMMM | HH:mm"
                        ).toUpperCase()} - {safeFormatDate(match.endTime, "HH:mm")}
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
                    <div className="flex justify-between text-sm pt-2">
                      <div className="flex items-center gap-4">
                        {match.result === "pending" || match.result === "unknown" ? (
                            <QuestionMarkCircleIcon className="h-10 text-gray-800" />
                        ) : (
                            <CheckCircleIcon className="h-10 text-green-800" />
                        )}
                        <div className="text-sm">
                          <h1>Niveau:</h1>
                          <h1>{match.level}</h1>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {match.participants.map((participant, index) => (
                            <p key={index}>{participant}</p>
                        ))}
                      </div>
                    </div>
                  </li>
              ))}
            </ul>
        ) : (
            <p className="text-gray-600">Ingen tidligere kampe.</p>
        )}

      </>
  );
};

export default MatchesTab;
