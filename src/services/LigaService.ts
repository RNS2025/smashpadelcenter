// services/LigaService.ts

import api from "../api/api";
import { League, TeamInfo } from "../types/LunarTypes";

// Cache leagues data in memory
let leaguesCache: { horsens: League[]; stensballe: League[] } | null = null;
let leaguesCacheTimestamp: number = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const fetchAllLeagues = async () => {
  // Return cached data if available and not expired
  if (leaguesCache && Date.now() - leaguesCacheTimestamp < CACHE_TTL) {
    return leaguesCache;
  }

  const response = await api.get("/liga/all/leagues");
  leaguesCache = response.data;
  leaguesCacheTimestamp = Date.now();
  return response.data;
};

export const fetchLeaguesHorsens = async () => {
  const response = await api.get("/liga/horsens/leagues");
  return response.data;
};

export const fetchLeaguesStensballe = async () => {
  const response = await api.get("/liga/stensballe/leagues");
  return response.data;
};

// Cache teams by league ID
const teamsCache = new Map<string, { data: TeamInfo[]; timestamp: number }>();

export const fetchTeamsByLeagueHorsens = async (leagueId: number) => {
  const cacheKey = `horsens_${leagueId}`;
  const cached = teamsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await api.get(`/liga/horsens/leagues/${leagueId}/teams`);
  teamsCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
  return response.data;
};

export const fetchTeamsByLeagueStensballe = async (leagueId: number) => {
  const cacheKey = `stensballe_${leagueId}`;
  const cached = teamsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await api.get(`/liga/stensballe/leagues/${leagueId}/teams`);
  teamsCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
  return response.data;
};

// New function to fetch teams in batch
export const fetchTeamsBatch = async (teamIds: number[]) => {
  if (!teamIds.length) return [];

  const response = await api.post("/liga/teams/batch", { teamIds });
  return response.data;
};

// Team info cache
const teamInfoCache = new Map<number, { data: any; timestamp: number }>();

export const fetchTeamInfo = async (teamId: number) => {
  const cached = teamInfoCache.get(teamId);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await api.get(`/liga/team/${teamId}`);
  teamInfoCache.set(teamId, { data: response.data, timestamp: Date.now() });
  return response.data;
};

export const fetchTeamStandings = async (teamId: number) => {
  const response = await api.get(`/liga/team/${teamId}/standings`);
  return response.data;
};

export const fetchTeamMatches = async (teamId: number) => {
  const response = await api.get(`/liga/team/${teamId}/matches`);
  return response.data;
};

export const fetchMatchDetails = async (matchId: number) => {
  const response = await api.get(`/liga/match/${matchId}/details`);
  return response.data[0];
};
