// services/LigaService.ts

import api from "../api/api";

export const fetchLeaguesHorsens = async () => {
  const response = await api.get("/liga/horsens/leagues");
  return response.data;
};

export const fetchLeaguesStensballe = async () => {
  const response = await api.get("/liga/stensballe/leagues");
  return response.data;
};

export const fetchAllLeagues = async () => {
  const response = await api.get("/liga/all/leagues");
  return response.data;
};

export const fetchTeamsByLeagueHorsens = async (leagueId: number) => {
  const response = await api.get(`/liga/horsens/leagues/${leagueId}/teams`);
  return response.data;
};

export const fetchTeamsByLeagueStensballe = async (leagueId: number) => {
  const response = await api.get(`/liga/stensballe/leagues/${leagueId}/teams`);
  return response.data;
};

export const fetchTeamInfo = async (teamId: number) => {
  const response = await api.get(`/liga/team/${teamId}`);
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
