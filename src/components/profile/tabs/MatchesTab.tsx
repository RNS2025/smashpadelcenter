import {useProfileContext} from "../../../context/ProfileContext.tsx";
import LoadingSpinner from "../../misc/LoadingSpinner.tsx";
import {Helmet} from "react-helmet-async";
import {safeFormatDate} from "../../../utils/dateUtils.ts";
import {CheckCircleIcon, QuestionMarkCircleIcon} from "@heroicons/react/24/outline";

const MatchesTab = () => {
    const { profile, matches, matchesLoading } = useProfileContext();
    console.log(matches);


    if (!profile) return(
        <div className="w-full flex justify-center items-center">
        <LoadingSpinner />
        </div>
    )

    
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
                    <div className="flex justify-between text-xs pt-2">
                      <div className="flex items-center gap-4">
                        {match.team1Sets !== 0 && match.team2Sets !== 0 ? (
                            <QuestionMarkCircleIcon className="size-8 text-gray-800" />
                        ) : (
                            <CheckCircleIcon className="size-8 text-green-800" />
                        )}
                        <div>
                          <h1>Niveau:</h1>
                          <h1>{match.level}</h1>
                        </div>
                      </div>
                      <div className="max-w-44 grid grid-cols-2 gap-2">
                          {[...match.participants, ...match.reservedSpots.map((r) => r.name)].map((player, index) => (
                            <p className="text-center truncate" key={index}>{player}</p>
                        ))}
                      </div>
                    </div>
                  </li>
              ))}
            </ul>
        ) : (
            <div className="border border-gray-900 p-2 rounded-lg text-gray-800">
            <p className="py-4 text-center text-gray-600">Ingen tidligere kampe.</p>
            </div>
        )}

      </>
  );
};

export default MatchesTab;
