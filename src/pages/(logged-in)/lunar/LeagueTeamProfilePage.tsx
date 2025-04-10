import {Helmet} from "react-helmet-async";
import {useEffect, useState} from "react";
import {TeamInfo} from "../../../types/LunarTypes.ts";
import {Outlet, useParams} from "react-router-dom";
import { fetchTeamInfo } from "../../../services/LigaService.ts";
import Animation from "../../../components/misc/Animation.tsx";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import TeamProfileTabMenu from "../../../components/lunar/teamProfile/TeamProfileTabMenu.tsx";

export const LeagueTeamProfilePage = () => {
    const { teamId } = useParams<{ teamId: string }>();

    const [team, setTeam] = useState<TeamInfo>();

    //TODO: Kunne også blive et hook?
    useEffect(() => {
        const fetchData = async () => {
            if (typeof teamId === "string") {
                const response = await fetchTeamInfo(parseInt(teamId, 10));
                setTeam(response);
            }
        }
        fetchData().then();
    }, [teamId]);


    return (
        <>
            <Helmet>
                <title>{team?.Team.Name ?? "Hold utilgængeligt"}</title>
            </Helmet>

            <Animation>
                <HomeBar backPage={"/holdligaer"} />

                {team && (

                    <div className="container mx-auto p-6 bg-white mt-10 shadow-md rounded-lg">
                        <dl className="flex gap-5 divide-y divide-gray-100 px-2">
                            {team.Team.HomeClubImageUrl && (
                                <img
                                    src={team.Team.HomeClubImageUrl}
                                    alt={`${team.Team.Name}'s profil`}
                                    className="w-32 h-32 rounded-full object-cover"
                                />
                            )}
                            <div className="w-full">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    {team.Team.Name}
                                </h1>
                                <div className="space-y-1 text-gray-600">

                                    <div className="flex gap-2">
                                        <dt className="font-semibold">Klub:</dt>

                                        <dl>
                                            <a href={team.Team.HomeClub.Name || "#"} className="text-cyan-500 hover:underline">{team.Team.HomeClub.Name}</a>
                                        </dl>
                                    </div>

                                    {/*//TODO: Jeg kan ikke få division og region ligesom i API-eksemplet */}
                                    <div className="flex gap-2">
                                        <dt className="font-semibold">Admin:</dt>

                                        <dl>{team.Team.Initiator.map((initiator) => initiator.Name).join(" | ")}</dl>
                                    </div>
                                </div>
                            </div>
                        </dl>

                        <div className="justify-self-center">
                            <TeamProfileTabMenu/>
                        </div>

                        <Outlet />
                    </div>
                )}
            </Animation>
        </>
    );
};

export default LeagueTeamProfilePage;