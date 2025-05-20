import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { TeamInfo, League } from "../../types/LunarTypes.ts";
import TeamListTable from "./misc/TeamListTable.tsx";
import useLeagueTeams from "../../hooks/useLeagueTeams";
import { useCallback } from "react";

export const LunarTeamsWomenTab = () => {
  const navigate = useNavigate();

  // Memoize the filter function to prevent recreation on each render
  const leagueFilter = useCallback((league: League) => {
    return league.name.includes("4P");
  }, []);
  // Use custom hook with memoized filter for "4P" leagues
  const { teams: lunarTeams, loading, error } = useLeagueTeams(leagueFilter);

  const handleRowClick = (team: TeamInfo) => {
    sessionStorage.setItem(`teamName_${team.id}`, team.name);
    navigate(`/holdligaer/${team.id}`);
  };

  return (
    <>
      <Helmet>
        <title>Lunar Ligaen 4P</title>
      </Helmet>

      <div className="sm:mx-20 mx-2">
        {loading ? (
          <div className="text-center py-8">Indlæser hold...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : lunarTeams.length === 0 ? (
          <div className="text-center py-8">Ingen hold fundet</div>
        ) : (
          <TeamListTable
            teams={lunarTeams}
            onRowClick={handleRowClick}
            loading={false}
          />
        )}
      </div>
    </>
  );
};

export default LunarTeamsWomenTab;
