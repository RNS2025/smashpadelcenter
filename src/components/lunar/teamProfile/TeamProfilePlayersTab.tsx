import {Helmet} from "react-helmet-async";
import {Player, TeamDetails} from "../../../types/LunarTypes.ts";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {fetchTeamInfo} from "../../../services/LigaService.ts";

export const TeamProfilePlayersTab = () => {

    const { teamId } = useParams<{ teamId: string }>();

    const [team, setTeam] = useState<TeamDetails>();

    useEffect(() => {
        const fetchData = async () => {
            if (typeof teamId === "string") {
                const response = await fetchTeamInfo(parseInt(teamId, 10));
                setTeam(response.Team);
            }
        }
        fetchData().then();
    }, [teamId]);


    return (
        <>
            <Helmet>
                <title>Spillere</title>
            </Helmet>

            {team && (
            <div className="overflow-auto max-h-[calc(100vh-340px)] rounded-lg border border-gray-200 shadow-lg my-5 text-xs">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white">
                    <thead className="text-left bg-gray-300 font-bold">
                    <tr>
                        <th className="px-4 py-2 text-gray-900 select-none">
                            <div className="flex items-center gap-2">
                                Spillernavn
                            </div>
                        </th>
                        <th className="px-4 py-2 text-gray-900 select-none">
                            <div className="flex items-center gap-2">
                                Klub
                            </div>
                        </th>
                        <th className="px-4 py-2 text-gray-900 select-none">
                            <div className="flex items-center gap-2">
                                By
                            </div>
                        </th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                    {team.Players.map((player: Player) => (
                        <tr key={player.Id}>
                            <td className="flex max-md:flex-col gap-2 px-4 py-4 font-medium text-gray-900">
                                {player.FirstName}
                                <div>
                                    {player.TeamParticipantType === "Captain" && <span className="p-1.5 bg-sky-900 rounded text-white select-none">Kaptajn</span>}
                                </div>
                            </td>
                            <td className="px-4 py-2 font-medium text-gray-900">
                                {player.HomeClub.Name}
                            </td>
                            <td className="px-4 py-2 font-medium text-gray-900">
                                {player.HomeClub.City}
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

export default TeamProfilePlayersTab;