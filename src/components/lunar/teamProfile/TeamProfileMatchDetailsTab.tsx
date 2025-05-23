import { Helmet } from "react-helmet-async";
import {useNavigate, useParams} from "react-router-dom";
import { Fragment, useEffect, useState, useMemo } from "react";
import { MatchDetails, TeamMatch } from "../../../types/LunarTypes.ts";
import { fetchMatchDetails, fetchTeamMatches } from "../../../services/LigaService.ts";

export const TeamProfileMatchDetailsTab = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const { teamId } = useParams<{ teamId: string }>();
    const navigate = useNavigate();

    const [matchDetails, setMatchDetails] = useState<MatchDetails>();
    const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (typeof matchId === "string") {
                const response = await fetchMatchDetails(parseInt(matchId, 10));
                setMatchDetails(response);
            }
        };
        fetchData().then();
    }, [matchId]);

    useEffect(() => {
        const fetchData = async () => {
            if (typeof teamId === "string") {
                const response = await fetchTeamMatches(parseInt(teamId, 10));
                setTeamMatches(response);
            }
        };
        fetchData().then();
    }, [teamId]);

    // Memoize current match
    const currentMatch = useMemo(() => {
        if (!teamMatches || !matchId) return null;
        return teamMatches.find((match) => match.MatchId === parseInt(matchId, 10)) || null;
    }, [teamMatches, matchId]);

    // Memoize match results
    const detailedMatches = useMemo(() => {
        return matchDetails?.Matches.Matches.filter((match) => match.MatchResult?.HasDetailedScore) || [];
    }, [matchDetails]);

    return (
        <>
            <Helmet>
                <title>Kampdetaljer</title>
            </Helmet>

            {matchDetails && currentMatch && matchDetails.Matches.Matches[0].Challenger.Name !== "Pending " ? (
                <div className="overflow-auto h-[calc(100vh-380px)] rounded-lg shadow-lg my-5 text-xxs">
                    <table className="min-w-[320px] w-full divide-y-2 divide-cyan-500 bg-slate-700/30">
                        <thead className="bg-slate-800/80 font-bold">
                        <tr>
                            <th className="px-2 py-2 text-gray-300 select-none w-[30%]">
                                <div className="flex items-center justify-center">
                                    {currentMatch.Team1.Name}
                                </div>
                            </th>
                            <th className="px-2 py-2 text-gray-300 select-none w-[30%]">
                                <div className="flex items-center justify-center">
                                    {currentMatch.Team2.Name}
                                </div>
                            </th>
                            <th className="px-2 py-2 text-gray-300 select-none w-[40%]">
                                <div className="flex items-center justify-center">
                                    Resultat
                                </div>
                            </th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-cyan-500">
                        {detailedMatches.map((match) => (
                            <Fragment key={match.Id}>
                                <tr className="text-center">
                                    <td className={`px-2 py-4 font-medium text-gray-300 ${match.MatchResult?.IsFirstParticipantWinner ? "text-green-500" : ""}`}>
                                        <div className="flex flex-col gap-1 items-center">
                                            <p>{match.Challenger.Name}</p>
                                            <p>{match.Challenger.Player2Name}</p>
                                        </div>
                                    </td>
                                    <td className={`px-2 py-4 font-medium text-gray-300 ${!match.MatchResult?.IsFirstParticipantWinner ? "text-green-500" : ""}`}>
                                        <div className="flex flex-col gap-1 items-center">
                                            <p>{match.Challenged.Name}</p>
                                            <p>{match.Challenged.Player2Name}</p>
                                        </div>
                                    </td>
                                    <td className="px-2 py-4 font-medium text-gray-300 flex flex-col items-center">
                                        <div className="flex flex-col gap-1 items-center">
                                            <p className="bg-cyan-500 font-semibold rounded-xl px-2 py-1 text-white w-fit align-middle">
                                                {match.MatchResult?.Score?.FirstParticipantScore} - {match.MatchResult?.Score?.SecondParticipantScore}
                                            </p>
                                            {match.MatchResult?.Score?.DetailedScoring && (
                                                <div className="flex items-center gap-x-2">
                                                    {match.MatchResult.Score.DetailedScoring.map((score, index) => (
                                                        <p key={index} className="text-gray-300 font-semibold">
                                                            {score.FirstParticipantScore} - {score.SecondParticipantScore}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            </Fragment>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col gap-6 items-center justify-center h-[calc(100vh-380px)]">
                    <p className="text-gray-300">Kampdetaljer er ikke indtastet.</p>
                    <button onClick={() => navigate(-1)} type="button" className="bg-slate-700/80 rounded w-full p-2 text-cyan-500">
                        Gå tilbage
                    </button>
                </div>
            )}
        </>
    );
};

export default TeamProfileMatchDetailsTab;
