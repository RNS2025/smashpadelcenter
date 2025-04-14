import {useEffect, useState} from "react";
import {TeamDetails, TeamDetailsResponse} from "../../../types/LunarTypes.ts";
import {Outlet, useParams} from "react-router-dom";
import { fetchTeamInfo } from "../../../services/LigaService.ts";
import Animation from "../../../components/misc/Animation.tsx";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import TeamProfileTabMenu from "../../../components/lunar/teamProfile/TeamProfileTabMenu.tsx";

export const LeagueTeamProfilePage = () => {
    const { teamId } = useParams<{ teamId: string }>();
    const cachedName = teamId ? sessionStorage.getItem(`teamName_${teamId}`) : null;
    const [team, setTeam] = useState<TeamDetails>();

    //TODO: Kunne også blive et hook?
    useEffect(() => {
        const fetchData = async () => {
            if (typeof teamId === "string") {
                const response: TeamDetailsResponse = await fetchTeamInfo(parseInt(teamId, 10));
                setTeam(response.Team);
            }
        };
        fetchData().then();
    }, [teamId]);

    //TODO: Har cachet holdnavnet for at få det fulde vist, men er ikke sikker på at det er holdbart på sigt
    return (
        <>
            <Animation>
                <HomeBar backPage={"/holdligaer"} />

                {team && (

                    <div className="mx-2 sm:mx-10 h-[calc(100vh-120px)] p-6 bg-white mt-10 shadow-md rounded-lg">
                        <dl className="flex gap-5 divide-y divide-gray-100 px-2">
                            {team && (
                                <img
                                    src={team.HomeClubImageUrl}
                                    alt={`${team.HomeClub.Name}'s profil`}
                                    className="w-16 h-16 sm:w-32 sm:h-32 rounded-full object-cover"
                                />
                            )}
                            <div className="w-full">
                                <h1 className="sm:text-xl md:text-3xl font-bold text-gray-800 mb-2">
                                    {cachedName}
                                </h1>

                                <div className="flex flex-col gap-2 max-sm:text-sm">
                                    {team.Initiator.map(initiator => (
                                        <div className="flex gap-2" key={initiator.Id}>
                                            <dt className="font-semibold text-gray-600">Admin:</dt>
                                            <dl>
                                                <a href={initiator.PlayerUrl} className="text-cyan-500 hover:underline">{initiator.Name}</a>
                                            </dl>
                                        </div>
                                    ))}

                                    <div className="text-gray-600">
                                        <div className="flex gap-2">
                                            <dt className="font-semibold">Klub:</dt>

                                            <dl>
                                                <a href={team.HomeClub.Name|| "#"} className="text-cyan-500 hover:underline">{team.HomeClub.Name}</a>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </dl>

                        <div className="justify-self-center max-xl:mt-5">
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