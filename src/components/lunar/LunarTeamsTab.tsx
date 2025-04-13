import {Helmet} from "react-helmet-async";
import {useEffect, useState} from "react";
import {League, TeamInfo} from "../../types/LunarTypes.ts";
import {
    fetchAllLeagues,
    fetchTeamsByLeagueHorsens,
    fetchTeamsByLeagueStensballe
} from "../../services/LigaService.ts";
import { useNavigate } from "react-router-dom";
import TeamListTable from "./misc/TeamListTable.tsx";

export const LunarTeamsTab = () => {
    const navigate = useNavigate();

    const [leagues, setLeagues] = useState<{ horsens: League[]; stensballe: League[] }>({ horsens: [], stensballe: [] });
    const [lunarTeams, setLunarTeams] = useState<TeamInfo[]>([]);


    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const response = await fetchAllLeagues();
                setLeagues(response);
            } catch (error) {
                console.error("Error fetching leagues:", error);
            }
        }
        fetchLeagues().then();
    }, []);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const lunarLeaguesHorsens = leagues.horsens.filter(l =>
                    l.name.includes("Lunar Ligaen - ")
                );

                const lunarLeaguesStensballe = leagues.stensballe.filter(l =>
                    l.name.includes("Lunar Ligaen - ")
                );

                const teamsFromHorsens = await Promise.all(
                    lunarLeaguesHorsens.map((l) => fetchTeamsByLeagueHorsens(l.id))
                );

                const teamsFromStensballe = await Promise.all(
                    lunarLeaguesStensballe.map((l) => fetchTeamsByLeagueStensballe(l.id))
                );

                const allTeams = [...teamsFromHorsens.flat(), ...teamsFromStensballe.flat()];

                setLunarTeams(allTeams);
            } catch (error) {
                console.error("Error fetching teams:", error);
            }
        };

        if (leagues.horsens.length && leagues.stensballe.length) {
            fetchTeams().then();
        }
    }, [leagues]);


    //TODO: Kunne godt tænke mig at få vist kaptajnen i tabellen på sigt
    return (
        <>
            <Helmet>
                <title>Lunar Ligaen</title>
            </Helmet>

            <div className="sm:mx-20 mx-2">
                <TeamListTable  teams={lunarTeams} onRowClick={(team) => {
                    sessionStorage.setItem(`teamName_${team.id}`, team.name);
                    navigate(`/holdligaer/${team.id}`);
                }}/>
            </div>
        </>
    );
};

export default LunarTeamsTab;