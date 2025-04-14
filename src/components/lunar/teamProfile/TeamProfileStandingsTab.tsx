import {Helmet} from "react-helmet-async";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
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


    return (
        <>
            <Helmet>
                <title>Tabeloversigt</title>
            </Helmet>

            {teamStandings && (
                <div className="overflow-auto xl:max-h-[550px] max-xl:max-h-[470px] rounded-lg border border-gray-200 shadow-lg my-5 text-sm">
                    <table className="min-w-[600px] w-full divide-y-2 divide-gray-200 bg-white">
                        <thead className="bg-gray-300 font-bold">
                        <tr>
                            <th className="py-2 text-gray-900 select-none w-[10%] sm:w-[30%]">
                                <div className="flex items-center gap-2 justify-self-center">
                                    Holdnavn
                                </div>
                            </th>
                            <th className="py-2 text-gray-900 select-none">
                                <div className="flex items-center gap-2 justify-self-center">
                                    Kampe spillet
                                </div>
                            </th>
                            <th className="py-2 text-gray-900 select-none">
                                <div className="flex items-center gap-2 justify-self-center">
                                    W-L
                                </div>
                            </th>
                            <th className="py-2 text-gray-900 select-none">
                                <div className="flex items-center gap-2 justify-self-center">
                                    Enkeltkampe (W-L)
                                </div>
                            </th>
                            <th className="py-2 text-gray-900 select-none">
                                <div className="flex items-center gap-2 justify-self-center">
                                    Sæt
                                </div>
                            </th>
                            <th className="py-2 text-gray-900 select-none">
                                <div className="flex items-center gap-2 justify-self-center">
                                    Partier
                                </div>
                            </th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200">
                        {teamStandings.ScoresViewModels.map((teamStanding) => (
                            <tr key={teamStanding.Standing} className="hover:bg-cyan-500 transition-colors duration-500">
                                <td className="px-2 py-4 font-medium text-gray-900 flex gap-4">
                                    <p>{teamStanding.Standing}.</p>
                                    <p>{teamStanding.ParticipantName}</p>
                                </td>
                                <td className="py-2 font-medium text-gray-900 text-center">
                                    {teamStanding.Played}
                                </td>
                                <td className="py-2 font-medium text-gray-900 text-center">
                                    {teamStanding.Wins} - {teamStanding.Losses}
                                </td>
                                <td className="py-2 font-medium text-gray-900 text-center">
                                    {teamStanding.GamesWon} - {teamStanding.GamesLost}
                                </td>
                                <td className="py-2 font-medium text-gray-900 text-center">
                                    {teamStanding.TeamGamesWon} - {teamStanding.TeamGamesLost}
                                </td>
                                <td className="py-2 font-medium text-gray-900 text-center">
                                    {teamStanding.ScoredPoints} - {teamStanding.ConcededPoints} ({teamStanding.PointsDifference > 0 ? '+' + teamStanding.PointsDifference : teamStanding.PointsDifference})
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