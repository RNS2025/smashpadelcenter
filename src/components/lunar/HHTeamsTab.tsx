import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { TeamInfo } from "../../types/LunarTypes.ts";
import TeamListTable from "./misc/TeamListTable.tsx";
import useLeagueTeams from "../../hooks/useLeagueTeams";

export const HHTeamsTab = () => {
  const navigate = useNavigate();

  // Use custom hook with filter for "HH" leagues
  const {
      teams: hhTeams,
    loading,
    error,
  } = useLeagueTeams((league) => league.name.includes("HH"));
    const isLoading = loading || hhTeams.length === 0;

  const handleRowClick = (team: TeamInfo) => {
    sessionStorage.setItem(`teamName_${team.id}`, team.name);
    navigate(`/holdligaer/${team.id}`);
  };

  return (
    <>
      <Helmet>
        <title>HH-Listen</title>
      </Helmet>

      <div className="sm:mx-20 mx-2">
        {loading ? (
          <div className="text-center py-8">Indlæser hold...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : (
          <TeamListTable teams={hhTeams} onRowClick={handleRowClick} loading={isLoading} />
        )}
      </div>
    </>
  );
};

export default HHTeamsTab;
