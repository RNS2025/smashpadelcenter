import {Helmet} from "react-helmet-async";
import {useParams} from "react-router-dom";
import {useEffect, useMemo, useState} from "react";
import {TeamStandingsResponse} from "../../../types/LunarTypes.ts";
import {fetchTeamStandings} from "../../../services/LigaService.ts";

export const TeamProfileStandingsTab = () => {
    const { teamId } = useParams<{ teamId: string }>();

    const [teamStandings, setTeamStandings] = useState<TeamStandingsResponse>();

    useEffect(() => {
        const fetchData = async () => {
            if (typeof teamId === "string") {
                const response = await fetchTeamStandings(parseInt(teamId, 10));
                setTeamStandings(response);
            }
        }
        fetchData().then();
    }, [teamId]);

    const standings = useMemo(() => {
        return teamStandings?.ScoresViewModels || [];
    }, [teamStandings]);


    return (
        <>
            <Helmet>
                <title>Tabeloversigt</title>
            </Helmet>

            {standings.length > 0 && (
                <div className="overflow-auto h-[calc(100vh-380px)] rounded-lg shadow-lg my-5 text-xxs">
                    <table className="min-w-[320px] w-full divide-y-2 divide-cyan-500 bg-slate-700/80">
                        <thead className="bg-slate-800/80 font-bold">
                        <tr>
                            <th className="py-2 text-gray-300 select-none w-[10%] sm:w-[30%]">
                                <div className="flex items-center justify-center">
                                    Holdnavn
                                </div>
                            </th>
                            <th className="py-2 text-gray-300 select-none">
                                <div className="flex items-center justify-center">
                                    KS
                                </div>
                            </th>
                            <th className="py-2 text-gray-300 select-none">
                                <div className="flex items-center justify-center">
                                    W-L
                                </div>
                            </th>
                            <th className="py-2 text-gray-300 select-none">
                                <div className="flex items-center justify-center">
                                    Enkeltkampe
                                </div>
                            </th>
                            <th className="py-2 text-gray-300 select-none">
                                <div className="flex items-center justify-center">
                                    Sæt
                                </div>
                            </th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-cyan-500">
                        {standings.map((teamStanding) => (
                            <tr key={teamStanding.Standing}>
                                <td className="px-2 py-4 font-medium text-gray-300 flex gap-4">
                                    <p>{teamStanding.Standing}.</p>
                                    <p>{teamStanding.ParticipantName}</p>
                                </td>
                                <td className="py-2 font-medium text-gray-300 text-center">
                                    {teamStanding.Played}
                                </td>
                                <td className="py-2 font-medium text-gray-300 text-center">
                                    {teamStanding.Wins} - {teamStanding.Losses}
                                </td>
                                <td className="py-2 font-medium text-gray-300 text-center">
                                    {teamStanding.GamesWon} - {teamStanding.GamesLost}
                                </td>
                                <td className="py-2 font-medium text-gray-300 text-center">
                                    {teamStanding.TeamGamesWon} - {teamStanding.TeamGamesLost}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
};

export default TeamProfileStandingsTab;