import api from "../api/api";
import { PadelMatch } from "../types/PadelMatch";

const communityApi = {
  getMatches: async (): Promise<PadelMatch[]> => {
    const response = await api.get("/matches");
    return response.data;
  },

  createMatch: async (match: Omit<PadelMatch, "id">): Promise<PadelMatch> => {
    const response = await api.post("/matches", match);
    return response.data;
  },

  joinMatch: async (matchId: string, username: string): Promise<PadelMatch> => {
    const response = await api.post(`/matches/${matchId}/join`, { username });
    return response.data;
  },

  confirmJoin: async (
    matchId: string,
    username: string
  ): Promise<PadelMatch> => {
    const response = await api.post(`/matches/${matchId}/confirm`, {
      username,
    });
    return response.data;
  },

  reserveSpots: async (
    matchId: string,
    spotIndex: number,
    reserve: boolean
  ): Promise<PadelMatch[]> => {
    const response = await api.patch(`/matches/${matchId}/reserve`, {
      spotIndex,
      reserve,
    });
    return response.data;
  },

  deleteMatch: async (matchId: string): Promise<PadelMatch[]> => {
    const response = await api.delete(`/matches/${matchId}`);
    return response.data;
  },

  getMatchById: async (matchId: string): Promise<PadelMatch> => {
    const response = await api.get(`/matches/${matchId}`);
    console.log(matchId);
    return response.data;
  },
  getMatchesByUser: async (username: string): Promise<PadelMatch[]> => {
    const response = await api.get(`/matches/player/${username}`);
    return response.data;
  },
};

export default communityApi;
