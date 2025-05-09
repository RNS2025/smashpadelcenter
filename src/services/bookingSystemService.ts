import api from "../api/api";
import CourtData from "../types/CourtData";
import { getFromCache, setToCache } from "../utils/cache";

/**
 * Henter alle banenavne
 */
export async function getCourtNames(): Promise<string[]> {
  const cacheKey = "courtNames";
  const cachedData = getFromCache<string[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await api.get<{ courts: string[] }>("/courts/names");
    setToCache(cacheKey, response.data.courts);
    return response.data.courts;
  } catch (error: any) {
    console.error("Fejl ved hentning af banenavne:", error.message);
    throw error;
  }
}

/**
 * Henter tider og status for hver bane
 */
export async function getAvailableCourtTimes(): Promise<CourtData[]> {
  const cacheKey = "availableCourtTimes";
  const cachedData = getFromCache<CourtData[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await api.get<{ data: CourtData[] }>("/courts/times");
    setToCache(cacheKey, response.data.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Fejl ved hentning af tider:", error.message);
    throw error;
  }
}
