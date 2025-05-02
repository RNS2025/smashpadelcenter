import api from "../api/api";
import { Feedback } from "../types/Feedback.ts";

const feedbackApi = {
    createFeedback: async (feedback: Omit<Feedback, "_id">): Promise<Feedback> => {
        const response = await api.post("/feedback", feedback);
        return response.data;
    },

    getAllFeedbacks: async (): Promise<Feedback[]> => {
        const response = await api.get("/feedback");
        return response.data;
    },

    resolveFeedback: async (id: string): Promise<void> => {
        await api.put(`/feedback/resolve/${id}`, { resolved: true });
    },
}

export default feedbackApi;