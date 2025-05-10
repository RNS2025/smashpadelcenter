// hooks/useLeagueTeams.ts

import { useState, useEffect, useMemo } from "react";
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

    fetchLeagues().then();
  }, []);

  const filteredHorsensLeagues = useMemo(() => {
    return leagues.horsens.filter(leagueFilter);
  }, [leagues.horsens, leagueFilter]);

  const filteredStensballeLeagues = useMemo(() => {
    return leagues.stensballe.filter(leagueFilter);
  }, [leagues.stensballe, leagueFilter]);

  // When leagues load, fetch the teams from filtered leagues
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        if (filteredHorsensLeagues.length === 0 && filteredStensballeLeagues.length === 0) {
          setTeams([]);
          setLoading(false);
          return;
        }

        const teamsPromisesHorsens = filteredHorsensLeagues.map((league) =>
            fetchTeamsByLeagueHorsens(league.id)
        );

        const teamsPromisesStensballe = filteredStensballeLeagues.map((league) =>
            fetchTeamsByLeagueStensballe(league.id)
        );

        const [horsensResults, stensballeResults] = await Promise.all([
          Promise.all(teamsPromisesHorsens),
          Promise.all(teamsPromisesStensballe),
        ]);

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

    fetchTeams().then();
  }, [filteredHorsensLeagues, filteredStensballeLeagues]);

  return { teams, loading, error };
};

export default useLeagueTeams;
