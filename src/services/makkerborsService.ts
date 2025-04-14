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

  joinMatch: async (
    matchId: number,
    username: string
  ): Promise<PadelMatch[]> => {
    const response = await api.post(`/matches/${matchId}/join`, { username });
    return response.data;
  },

  confirmJoin: async (
    matchId: number,
    username: string
  ): Promise<PadelMatch[]> => {
    const response = await api.post(`/matches/${matchId}/confirm`, {
      username,
    });
    return response.data;
  },

  reserveSpots: async (
    matchId: number,
    spotIndex: number,
    reserve: boolean
  ): Promise<PadelMatch[]> => {
    const response = await api.patch(`/matches/${matchId}/reserve`, {
      spotIndex,
      reserve,
    });
    return response.data;
  },

  deleteMatch: async (matchId: number): Promise<PadelMatch[]> => {
    const response = await api.delete(`/matches/${matchId}`);
    return response.data;
  },
};

export default communityApi;
