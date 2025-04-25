import { useEffect, useState } from "react";
import { TeamDetails, TeamDetailsResponse } from "../../../types/LunarTypes.ts";
import { Outlet, useParams } from "react-router-dom";
import { fetchTeamInfo } from "../../../services/LigaService.ts";
import Animation from "../../../components/misc/Animation.tsx";
import HomeBar from "../../../components/misc/HomeBar.tsx";
import TeamProfileTabMenu from "../../../components/lunar/teamProfile/TeamProfileTabMenu.tsx";
import LoadingSpinner from "../../../components/misc/LoadingSpinner.tsx";

export const LeagueTeamProfilePage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const cachedName = teamId ? sessionStorage.getItem(`teamName_${teamId}`) : null;
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      if (!teamId || isNaN(parseInt(teamId, 10))) {
        setError("Invalid team ID");
        setLoading(false);
        return;
      }

      try {
        const response: TeamDetailsResponse = await fetchTeamInfo(
          parseInt(teamId, 10)
        );
        setTeam(response.Team);
        if (response.Team?.Name && !sessionStorage.getItem(`teamName_${teamId}`)) {
          sessionStorage.setItem(`teamName_${teamId}`, response.Team.Name);
        }
      } catch (err) {
        setError("Failed to fetch team information");
      } finally {
        setLoading(false);
      }
    };

    fetchData().then();
  }, [teamId]);

  if (loading) {
    return (
      <Animation>
        <HomeBar backPage="/holdligaer" />
        <div className="h-full w-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Animation>
    );
  }

  if (error || !team) {
    return (
      <Animation>
        <HomeBar backPage="/holdligaer" />
        <div className="mx-auto p-6 mt-10 text-center text-red-500">
          {error || "Hold ikke fundet"}
        </div>
      </Animation>
    );
  }

  return (
    <Animation>
      <HomeBar backPage="/holdligaer" />
      <div className="mx-2 sm:mx-10 p-6 bg-white mt-10 shadow-md rounded-lg">
        <div className="flex gap-5 px-2">
          <img
            src={team.HomeClubImageUrl}
            alt={`${team.HomeClub.Name}s profil`}
            className="w-16 h-16 sm:w-32 sm:h-32 rounded-full object-cover"
          />
          <div className="w-full">
            <h1 className="sm:text-xl md:text-3xl font-bold text-gray-800 mb-2">
              {cachedName || ""}
            </h1>
            <div className="flex flex-col gap-2 max-sm:text-sm text-gray-600">
              {team.Initiator.map((initiator) => (
                <div className="flex gap-2" key={initiator.Id}>
                  <dt className="font-semibold">Admin:</dt>
                  <dd>
                    <a
                      href={initiator.PlayerUrl || "#"}
                      className="text-cyan-500 hover:underline"
                    >
                      {initiator.Name}
                    </a>
                  </dd>
                </div>
              ))}
              <div className="flex gap-2">
                <dt className="font-semibold">Club:</dt>
                <dd>
                  <a
                    href={team.HomeClub.Name || "#"}
                    className="text-cyan-500 hover:underline"
                  >
                    {team.HomeClub.Name}
                  </a>
                </dd>
              </div>
            </div>
          </div>
        </div>
        <div className="justify-self-center max-xl:mt-5">
          <TeamProfileTabMenu />
        </div>
        <Outlet />
      </div>
    </Animation>
  );
};

export default LeagueTeamProfilePage;
