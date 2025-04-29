import api from "../api/api";
import { Briefing } from "../types/Briefing.ts";

const briefingApi = {
    createBriefing: async (briefing: Omit<Briefing, "id">): Promise<Briefing> => {
        const response = await api.post("/briefing", briefing);
        return response.data;
    },

    getAllBriefings: async (): Promise<Briefing[]> => {
        const response = await api.get("/briefing");
        return response.data;
    },

    getBriefingById: async (id: string): Promise<Briefing> => {
        const response = await api.get(`/briefing/${id}`);
        return response.data;
    },

    updateBriefing: async (id: string, briefing: Partial<Briefing>): Promise<Briefing> => {
        const response = await api.put(`/briefing/${id}`, briefing);
        return response.data;
    },
}

export default briefingApi;