import {Helmet} from "react-helmet-async";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {MatchDetails, TeamMatch} from "../../../types/LunarTypes.ts";
import {fetchMatchDetails, fetchTeamMatches} from "../../../services/LigaService.ts";

export const TeamProfileMatchDetailsTab = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const { teamId } = useParams<{ teamId: string }>();

    const [matchDetails, setMatchDetails] = useState<MatchDetails>();
    const [teamMatches, setTeamMatches] = useState<TeamMatch[]>();

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
        }
        fetchData().then();
    }, [teamId]);

    const currentMatch = teamMatches?.find((match) => match.MatchId === parseInt(matchId ?? "", 10));



    return (
        <>
            <Helmet>
                <title>Kampdetaljer</title>
            </Helmet>

            {matchDetails && currentMatch && (
                <div className="overflow-auto rounded-lg border border-gray-200 shadow-lg my-5 text-sm">
                    <table className="min-w-full divide-y-2 divide-gray-200 bg-white">
                        <thead className="text-left bg-gray-300 font-bold">
                        <tr>
                            <th className="px-4 py-2 text-gray-900 select-none">
                                <div className="flex items-center gap-2">
                                    {currentMatch.Team1.Name}
                                </div>
                            </th>
                            <th className="px-4 py-2 text-gray-900 select-none">
                                <div className="flex items-center gap-2">
                                    {currentMatch.Team2.Name}
                                </div>
                            </th>
                            <th className="px-4 py-2 text-gray-900 select-none w-[20%]">
                                <div className="flex items-center gap-2">
                                    Resultat
                                </div>
                            </th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200">
                        {matchDetails?.Matches.Matches.map((match) => (
                            <>
                                <tr key={match.Id} className="hover:bg-cyan-500 transition-colors duration-500">
                                    <td className={`px-4 py-4 font-medium text-gray-900 ${match.MatchResult?.IsFirstParticipantWinner ? "font-semibold" : ""}`}>
                                        <p>{match.Challenger.Name}</p>
                                        <p>{match.Challenger.Player2Name}</p>
                                    </td>
                                    <td className={`px-4 py-4 font-medium text-gray-900 ${!match.MatchResult?.IsFirstParticipantWinner ? "font-semibold" : ""}`}>
                                        <p>{match.Challenged.Name}</p>
                                        <p>{match.Challenged.Player2Name}</p>
                                    </td>
                                    <td className="px-4 py-4 font-medium text-gray-900 grid grid-cols-[30%_70%]">
                                        <p className="bg-sky-900 font-semibold rounded-xl p-2 text-white w-fit align-middle">
                                            {match.MatchResult?.Score?.FirstParticipantScore} - {match.MatchResult?.Score?.SecondParticipantScore}
                                        </p>
                                        {match.MatchResult?.Score?.DetailedScoring && (
                                            <div className="flex items-center gap-x-2">
                                                {match.MatchResult.Score.DetailedScoring.map((score, index) => (
                                                    <p key={index} className="text-sm text-gray-600 font-semibold">
                                                        {score.FirstParticipantScore} - {score.SecondParticipantScore}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            </>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
};

export default TeamProfileMatchDetailsTab;