// hooks/useLeagueTeams.ts

import { useState, useEffect } from "react";
import { League, TeamInfo } from "../types/LunarTypes";
import {
  fetchAllLeagues,
  fetchTeamsByLeagueHorsens,
  fetchTeamsByLeagueStensballe,
} from "../services/LigaService";

type LeagueFilterFunction = (league: League) => boolean;

/**
 * Custom hook for fetching and filtering league teams
 * @param leagueFilter - Function to filter leagues by name or other criteria
 */
export const useLeagueTeams = (leagueFilter: LeagueFilterFunction) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<{
    horsens: League[];
    stensballe: League[];
  }>({ horsens: [], stensballe: [] });
  const [teams, setTeams] = useState<TeamInfo[]>([]);

  // Fetch all leagues once
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLoading(true);
        const response = await fetchAllLeagues();
        setLeagues(response);
      } catch (err) {
        console.error("Error fetching leagues:", err);
        setError("Failed to load leagues");
      }
    };

    fetchLeagues();
  }, []);

  // When leagues load, fetch the teams from filtered leagues
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        if (!leagues.horsens.length && !leagues.stensballe.length) return;

        // Filter leagues based on the provided filter function
        const filteredHorsensLeagues = leagues.horsens.filter(leagueFilter);
        const filteredStensballeLeagues =
          leagues.stensballe.filter(leagueFilter);

        // Check if we have any leagues at all
        if (
          filteredHorsensLeagues.length === 0 &&
          filteredStensballeLeagues.length === 0
        ) {
          setTeams([]);
          setLoading(false);
          return;
        }

        // Fetch teams from Horsens leagues
        const teamsPromisesHorsens = filteredHorsensLeagues.map((league) =>
          fetchTeamsByLeagueHorsens(league.id)
        );

        // Fetch teams from Stensballe leagues
        const teamsPromisesStensballe = filteredStensballeLeagues.map(
          (league) => fetchTeamsByLeagueStensballe(league.id)
        );

        // Execute all promises concurrently
        const [horsensResults, stensballeResults] = await Promise.all([
          Promise.all(teamsPromisesHorsens),
          Promise.all(teamsPromisesStensballe),
        ]);

        // Combine all teams
        const allTeams = [
          ...horsensResults.flat(),
          ...stensballeResults.flat(),
        ];

        setTeams(allTeams);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError("Failed to load teams");
        setLoading(false);
      }
    };

    if (leagues.horsens.length || leagues.stensballe.length) {
      fetchTeams();
    }
  }, [leagues, leagueFilter]);

  return { teams, loading, error };
};

export default useLeagueTeams;
