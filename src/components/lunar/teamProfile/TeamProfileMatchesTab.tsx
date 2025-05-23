import {Helmet} from "react-helmet-async";
import {useNavigate, useParams} from "react-router-dom";
import {Fragment, useEffect, useMemo, useState} from "react";
import {TeamMatch} from "../../../types/LunarTypes.ts";
import {fetchTeamMatches} from "../../../services/LigaService.ts";
import {ClockIcon, MapPinIcon} from "@heroicons/react/24/outline";

export const TeamProfileMatchesTab = () => {
    const navigate = useNavigate();
    const { teamId } = useParams<{ teamId: string }>();

    const [teamMatches, setTeamMatches] = useState<TeamMatch[]>();

    useEffect(() => {
        const fetchData = async () => {
            if (typeof teamId === "string") {
                const response = await fetchTeamMatches(parseInt(teamId, 10));
                setTeamMatches(response);
            }
        }
        fetchData().then();
    }, [teamId]);

    const memoizedMatches = useMemo(() => {
        if (!teamMatches) return [];
        return teamMatches.map((match) => ({
            ...match,
            isUpcoming: !match.ShowResults && match.Date !== "00:00" && !match.ShowPlayerEnterResultButton,
            isHighlighted: match.Team1.IsWinner || match.Team2.IsWinner,
            displayResult: match.ShowResults ? `${match.Team1.Result} - ${match.Team2.Result}` : "Ikke afviklet",
        }));
    }, [teamMatches]);

    return (
        <>
            <Helmet>
                <title>Kampe</title>
            </Helmet>

            {memoizedMatches.length > 0 && (
                <div className="overflow-auto h-[calc(100vh-380px)] rounded-lg shadow-lg my-5 text-xxs">
                    <table className="min-w-[320px] w-full divide-y-2 divide-cyan-500 bg-slate-700/30">
                        <thead className="bg-slate-800/80 font-bold">
                        <tr>
                            <th className="py-2 text-gray-300 select-none">
                                <div className="flex items-center justify-center">
                                    Dato
                                </div>
                            </th>
                            <th className="py-2 text-gray-300 select-none">
                                <div className="flex items-center justify-center">
                                    Hjemmehold
                                </div>
                            </th>
                            <th className="py-2 text-gray-300 select-none">
                                <div className="flex items-center justify-center ">
                                    Udehold
                                </div>
                            </th>
                            <th className="py-2 text-gray-300 select-none">
                                <div className="flex items-center justify-center">
                                    Resultat
                                </div>
                            </th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-cyan-500">
                        {memoizedMatches.map((match) => (
                                <Fragment key={match.MatchId}>
                                <tr>
                                    <td className="px-2 py-4 font-medium text-gray-300">{match.Details.Date}</td>
                                    <td className={`px-2 py-4 font-medium text-gray-300 text-center ${match.Team1.IsWinner ? "text-green-500" : ""}`}>
                                        {match.Team1.Name}
                                    </td>
                                    <td className={`px-2-4 py-4 font-medium text-gray-300 text-center ${match.Team2.IsWinner ? "text-green-500" : ""}`}>
                                        {match.Team2.Name}
                                    </td>
                                    <td className="grid grid-rows-3 px-2 py-4 font-medium text-gray-300 text-center">
                                        <div></div>
                                        {!match.ShowPlayerEnterResultButton && (
                                            <p className={`${match.ShowPlayerEnterResultButton ? "font-semibold" : ""}`}>
                                                {match.ShowResults
                                                    ? `${match.Team1.Result} - ${match.Team2.Result}`
                                                    : "Ikke afviklet"}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => navigate(`${match.MatchId}`)}
                                            className={`bg-cyan-500 rounded text-white p-1 px-2 ${match.ShowUpcomingInfoText ? "hidden" : ""}`}>Info
                                        </button>
                                    </td>
                                </tr>

                                {match.isUpcoming && (
                                    <tr key={`${match.MatchId}-extra`}>
                                        <td colSpan={5} className="px-2 py-2 text-xxs text-gray-300 border-t-2 border-white">
                                            <div className="flex justify-center items-center gap-1 text-gray-300">
                                                <ClockIcon className="h-5"/>
                                                <p className="pt-0.5">{match.Date}</p>

                                                <MapPinIcon className="h-5 ml-2"/>
                                                <p className="pt-0.5">{match.Location.replace(',', ' - ')}</p>
                                            </div>

                                        </td>
                                    </tr>
                                )}
                                </Fragment>
                        ))}
                        </tbody>

                    </table>
                </div>
            )}
        </>
    );
};

export default TeamProfileMatchesTab;