import api from "../api/api";
import { League, TeamInfo } from "../types/LunarTypes";
import { getFromCache, setToCache } from "../utils/cache";

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch all leagues (with caching and pre-fetching)
 */
export const fetchAllLeagues = async () => {
  const cacheKey = "allLeagues";
  const cachedData = getFromCache<{ horsens: League[]; stensballe: League[] }>(
    cacheKey
  );

  if (cachedData) {
    return cachedData;
  }

  const response = await api.get("/liga/all/leagues");
  setToCache(cacheKey, response.data, CACHE_TTL);
  return response.data;
};

/**
 * Pre-fetch all leagues in the background
 */
export const prefetchAllLeagues = () => {
  fetchAllLeagues().catch((error) =>
    console.error("Failed to prefetch leagues:", error)
  );
};

/**
 * Fetch leagues for Horsens (with caching)
 */
export const fetchLeaguesHorsens = async () => {
  const cacheKey = "leaguesHorsens";
  const cachedData = getFromCache<League[]>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const response = await api.get("/liga/horsens/leagues");
  setToCache(cacheKey, response.data, CACHE_TTL);
  return response.data;
};

/**
 * Fetch leagues for Stensballe (with caching)
 */
export const fetchLeaguesStensballe = async () => {
  const cacheKey = "leaguesStensballe";
  const cachedData = getFromCache<League[]>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const response = await api.get("/liga/stensballe/leagues");
  setToCache(cacheKey, response.data, CACHE_TTL);
  return response.data;
};

/**
 * Fetch teams by league for Horsens (with caching)
 */
export const fetchTeamsByLeagueHorsens = async (leagueId: number) => {
  const cacheKey = `horsens_${leagueId}`;
  const cachedData = getFromCache<TeamInfo[]>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const response = await api.get(`/liga/horsens/leagues/${leagueId}/teams`);
  setToCache(cacheKey, response.data, CACHE_TTL);
  return response.data;
};

/**
 * Fetch teams by league for Stensballe (with caching)
 */
export const fetchTeamsByLeagueStensballe = async (leagueId: number) => {
  const cacheKey = `stensballe_${leagueId}`;
  const cachedData = getFromCache<TeamInfo[]>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const response = await api.get(`/liga/stensballe/leagues/${leagueId}/teams`);
  setToCache(cacheKey, response.data, CACHE_TTL);
  return response.data;
};

/**
 * Fetch team info (with caching)
 */
export const fetchTeamInfo = async (teamId: number) => {
  const cacheKey = `teamInfo_${teamId}`;
  const cachedData = getFromCache<any>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const response = await api.get(`/liga/team/${teamId}`);
  setToCache(cacheKey, response.data, CACHE_TTL);
  return response.data;
};

/**
 * Fetch team standings
 */
export const fetchTeamStandings = async (teamId: number) => {
  const cacheKey = `teamStandings_${teamId}`;
  const cachedData = getFromCache<any>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const response = await api.get(`/liga/team/${teamId}/standings`);
  setToCache(cacheKey, response.data, CACHE_TTL);
  return response.data;
};

/**
 * Fetch team matches
 */
export const fetchTeamMatches = async (teamId: number) => {
  const cacheKey = `teamMatches_${teamId}`;
  const cachedData = getFromCache<any>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const response = await api.get(`/liga/team/${teamId}/matches`);
  setToCache(cacheKey, response.data, CACHE_TTL);
  return response.data;
};

/**
 * Fetch match details
 */
export const fetchMatchDetails = async (matchId: number) => {
  const cacheKey = `matchDetails_${matchId}`;
  const cachedData = getFromCache<any>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const response = await api.get(`/liga/match/${matchId}/details`);
  setToCache(cacheKey, response.data[0], CACHE_TTL);
  return response.data[0];
};
