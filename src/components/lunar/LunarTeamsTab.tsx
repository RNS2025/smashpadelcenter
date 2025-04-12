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
import {ChevronDownIcon, ChevronUpIcon} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

type SortableFields = "Name" | "HomeClub.Name";

export const LunarTeamsTab = () => {
    const navigate = useNavigate();

    const [horsensLeagues, setHorsensLeagues] = useState<League[]>([]);
    const [stensballeLeagues, setStensballeLeagues] = useState<League[]>([]);
    const [lunarTeams, setLunarTeams] = useState<TeamInfo[]>([]);

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortField, setSortField] = useState<SortableFields>("Name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const filteredTeams = lunarTeams.filter((lunarTeam) =>
        lunarTeam.Team.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lunarTeam.Team.HomeClub.Name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSort = (field: SortableFields) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };


    const sortedTeams = [...filteredTeams].sort((a, b) => {
        let valueA = "";
        let valueB = "";

        if (sortField === "Name") {
            valueA = a.Team.Name;
            valueB = b.Team.Name;
        } else if (sortField === "HomeClub.Name") {
            valueA = a.Team.HomeClub.Name;
            valueB = b.Team.HomeClub.Name;
        }

        return sortDirection === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
    });


    //TODO: Jeg skal have en anden måde at hente disse hold på i backend, køretiden er for lang
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
            try {
                const selectedHorsensLeague = horsensLeagues.find((l) =>
                    l.name.includes("Lunar Ligaen - ")
                );

                const selectedStensballeLeague = stensballeLeagues.find((l) =>
                    l.name.includes("Lunar Ligaen - ")
                );


                const teamsFromHorsens = selectedHorsensLeague
                    ? await fetchTeamsByLeagueHorsens(selectedHorsensLeague.id)
                    : [];

                const teamsFromStensballe = selectedStensballeLeague
                    ? await fetchTeamsByLeagueStensballe(selectedStensballeLeague.id)
                    : [];

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

    //TODO: Kunne godt tænke mig at få vist kaptajnen i tabellen på sigt
    return (
        <>
            <Helmet>
                <title>Lunar Ligaen</title>
            </Helmet>

            <div className="mx-20">
            <input
                type="text"
                placeholder="Søg efter hold..."
                className="w-96 text-gray-900 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="overflow-auto rounded-lg border border-gray-200 shadow-lg my-5">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                    <thead className="text-left bg-gray-300 font-bold">
                    <tr>
                        <th className="px-4 py-2 text-gray-900 cursor-pointer select-none w-[80%]">
                            <div className="flex items-center gap-2" onClick={() => handleSort("Name")}>
                                Holdnavn
                                {sortField === "Name" &&
                                    (sortDirection === "asc" ? (
                                        <ChevronUpIcon className="h-5" />
                                    ) : (
                                        <ChevronDownIcon className="h-5" />
                                    ))}
                            </div>
                        </th>


                        <th className="px-4 py-2 text-gray-900 cursor-pointer select-none">
                            <div className="flex items-center gap-2" onClick={() => handleSort("HomeClub.Name")}>
                                Klub
                                {sortField === "HomeClub.Name" &&
                                    (sortDirection === "asc" ? (
                                        <ChevronUpIcon className="h-5" />
                                    ) : (
                                        <ChevronDownIcon className="h-5" />
                                    ))}
                            </div>
                        </th>


                    </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                    {sortedTeams.length > 0 ? (
                        sortedTeams.map((team) => (
                            <tr
                                key={team.Team.Id}
                                className="hover:bg-cyan-500 transition-colors duration-500 cursor-pointer"
                                onClick={() => {
                                    sessionStorage.setItem(`teamName_${team.Team.Id}`, team.Team.Name);
                                    navigate(`/holdligaer/${team.Team.Id}`);
                                }}


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
        </div>
        </>
    );
};

export default LunarTeamsTab;