import {Helmet} from "react-helmet-async";
import {useEffect, useState} from "react";
import {League, TeamInfo} from "../../types/LunarTypes.ts";
import {
    fetchLeaguesHorsens,
    fetchLeaguesStensballe,
    fetchTeamInfo,
    fetchTeamsByLeagueHorsens,
    fetchTeamsByLeagueStensballe
} from "../../services/LigaService.ts";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";

export const LunarHorsensTab = () => {

    const [horsensLeagues, setHorsensLeagues] = useState<League[]>([]);
    const [stensballeLeagues, setStensballeLeagues] = useState<League[]>([]);
    const [lunarTeams, setLunarTeams] = useState<TeamInfo[]>([]);

    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const leaguesHorsens = await fetchLeaguesHorsens();
                const leaguesStensballe = await fetchLeaguesStensballe();

                setHorsensLeagues(leaguesHorsens);
                setStensballeLeagues(leaguesStensballe);
            } catch (error) {
                console.error("Error fetching leagues:", error);
            }
        }
        fetchLeagues().then();
    }, []);

    useEffect(() => {
        const fetchTeams = async () => {
            if (horsensLeagues.length === 0 || stensballeLeagues.length === 0) return;

            try {
                const teamsFromHorsens = await fetchTeamsByLeagueHorsens(horsensLeagues[0].id);
                const teamsFromStensballe = await fetchTeamsByLeagueStensballe(stensballeLeagues[0].id);

                const allTeams = [...teamsFromHorsens, ...teamsFromStensballe];

                const fullTeamInfos: TeamInfo[] = await Promise.all(
                    allTeams.map(async (team) => {
                        const info = await fetchTeamInfo(team.id);
                        return {
                            ...info,
                            Team: {
                                ...info.Team,
                                Name: team.name
                            }
                        };
                    })
                );

                setLunarTeams(fullTeamInfos);

            } catch (error) {
                console.error("Error fetching team infos:", error);
            }
        };

        fetchTeams().then();
    }, [horsensLeagues, stensballeLeagues]);






    return (
        <>
            <Helmet>
                <title>Lunar Ligaen</title>
            </Helmet>

            <div className="overflow-auto rounded-lg border border-gray-200 shadow-lg mx-20 my-5">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                    <thead className="text-left bg-gray-300 font-bold">
                    <tr>
                        <th className="px-4 py-2 text-gray-900 cursor-pointer select-none w-[90%]">
                            Holdnavn
                        </th>

                        <th className="px-4 py-2 text-gray-900 cursor-pointer select-none">
                            Klub
                        </th>

                    </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                    {lunarTeams.length > 0 ? (
                        lunarTeams.map((team) => (
                            <tr
                                key={team.Team.Id}
                                className="hover:bg-cyan-500 transition-colors duration-500 cursor-pointer"
                            >
                                <td className="cursor-pointer px-4 py-2 font-medium text-gray-900">
                                    {team.Team.Name}
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-900">
                                    {team.Team.HomeClub.Name}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={2}>
                                <div className="flex justify-center items-center py-10 text-gray-500">
                                    <LoadingSpinner />
                                </div>
                            </td>
                        </tr>

                    )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default LunarHorsensTab;