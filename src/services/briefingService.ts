import api from "../api/api";
import { Briefing } from "../types/Briefing.ts";
import { getFromCache, setToCache, clearCache } from "../utils/cache";

const briefingApi = {
  createBriefing: async (briefing: Omit<Briefing, "id">): Promise<Briefing> => {
    const response = await api.post("/briefing", briefing);
    clearCache("allBriefings"); // Invalidate cache for all briefings
    return response.data;
  },

  getAllBriefings: async (): Promise<Briefing[]> => {
    const cacheKey = "allBriefings";
    const cachedData = getFromCache<Briefing[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await api.get("/briefing");
    setToCache(cacheKey, response.data);
    return response.data;
  },

  getBriefingById: async (id: string): Promise<Briefing> => {
    const cacheKey = `briefing_${id}`;
    const cachedData = getFromCache<Briefing>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await api.get(`/briefing/${id}`);
    setToCache(cacheKey, response.data);
    return response.data;
  },

  updateBriefing: async (
    id: string,
    briefing: Partial<Briefing>
  ): Promise<Briefing> => {
    const response = await api.put(`/briefing/${id}`, briefing);
    clearCache(`briefing_${id}`); // Invalidate cache for the specific briefing
    clearCache("allBriefings"); // Invalidate cache for all briefings
    return response.data;
  },
};

export default briefingApi;
