import api from "../api/api";
import CourtData from "../types/CourtData";

/**
 * Henter alle banenavne
 */
export async function getCourtNames(): Promise<string[]> {
  try {
    const response = await api.get<{ courts: string[] }>("/courts/names");
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
  try {
    const response = await api.get<{ data: CourtData[] }>("/courts/times");
    return response.data.data;
  } catch (error: any) {
    console.error("Fejl ved hentning af tider:", error.message);
    throw error;
  }
}
