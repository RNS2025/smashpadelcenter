import {Helmet} from "react-helmet-async";
import {useEffect, useState} from "react";
import {League, TeamInfo} from "../../types/LunarTypes.ts";
import {
    fetchAllLeagues,
    fetchTeamsByLeagueHorsens,
    fetchTeamsByLeagueStensballe
} from "../../services/LigaService.ts";
import {useNavigate} from "react-router-dom";
import TeamListTable from "./misc/TeamListTable.tsx";


export const HHTeamsTab = () => {
    const navigate = useNavigate();

    const [leagues, setLeagues] = useState<{ horsens: League[]; stensballe: League[] }>({ horsens: [], stensballe: [] });
    const [hhTeams, setHhTeams] = useState<TeamInfo[]>([]);


    //TODO: Nu kan vi lave et hook
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
                    l.name.includes("HH")
                );

                const lunarLeaguesStensballe = leagues.stensballe.filter(l =>
                    l.name.includes("HH")
                );

                const teamsFromHorsens = await Promise.all(
                    lunarLeaguesHorsens.map((l) => fetchTeamsByLeagueHorsens(l.id))
                );

                const teamsFromStensballe = await Promise.all(
                    lunarLeaguesStensballe.map((l) => fetchTeamsByLeagueStensballe(l.id))
                );

                const allTeams = [...teamsFromHorsens.flat(), ...teamsFromStensballe.flat()];

                setHhTeams(allTeams);
            } catch (error) {
                console.error("Error fetching teams:", error);
            }
        };

        if (leagues.horsens.length && leagues.stensballe.length) {
            fetchTeams().then();
        }
    }, [leagues]);





    return (
        <>
            <Helmet>
                <title>HH-Listen</title>
            </Helmet>

            <div className="sm:mx-20 mx-2">
                <TeamListTable  teams={hhTeams} onRowClick={(team) => {
                    sessionStorage.setItem(`teamName_${team.id}`, team.name);
                    navigate(`/holdligaer/hh-listen/${team.id}`);
                }}/>
            </div>
        </>
    );
};

export default HHTeamsTab;