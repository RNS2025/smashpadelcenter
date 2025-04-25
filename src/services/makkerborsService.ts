import api from "../api/api";
import { PadelMatch } from "../types/PadelMatch";
import { PrivateEvent } from "../types/PrivateEvent.ts";

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

  confirmJoinMatch: async (
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
    return response.data;
  },
  getMatchesByUser: async (username: string): Promise<PadelMatch[]> => {
    const response = await api.get(`/matches/player/${username}`);
    return response.data;
  },

  //Private Arrangementer
  getPrivateEventsForUser: async (
    username: string
  ): Promise<PrivateEvent[]> => {
    const response = await api.get(`/private-event/${username}`);

    console.log(
      "[DEBUG] Response from getPrivateEventsForUser:",
      response.data
    );
    return response.data;
  },
  getPrivateEvents: async (): Promise<PrivateEvent[]> => {
    const response = await api.get("/private-event");
    console.log("[DEBUG] Response from getPrivateEvents:", response.data);
    return response.data;
  },
  getEventById: async (eventId: string): Promise<PrivateEvent> => {
    const response = await api.get(`/private-event/${eventId}`);
    console.log("[DEBUG] Response from getEventById:", response.data);
    return response.data;
  },
  createPrivateEvent: async (
    privateEvent: Omit<PrivateEvent, "id">
  ): Promise<PrivateEvent> => {
    const response = await api.post("/private-event", privateEvent);
    console.log("[DEBUG] Response from createPrivateEvent:", response.data);
    return response.data;
  },
  updatePrivateEvent: async (
    eventId: string,
    update: Partial<Omit<PrivateEvent, "id">>
  ): Promise<PrivateEvent> => {
    const response = await api.patch(`/private-event/${eventId}`, update);
    console.log("[DEBUG] Response from updatePrivateEvent:", response.data);
    return response.data;
  },
  joinEvent: async (
    eventId: string,
    username: string
  ): Promise<PrivateEvent> => {
    const response = await api.post(`/private-event/${eventId}/join`, {
      username,
    });
    console.log("[DEBUG] Response from joinEvent:", response.data);
    return response.data;
  },
  confirmJoinEvent: async (
    eventId: string,
    username: string
  ): Promise<PrivateEvent> => {
    const response = await api.post(`/private-event/${eventId}/confirm`, {
      username,
    });
    console.log("[DEBUG] Response from confirmJoinEvent:", response.data);
    return response.data;
  },
  deleteEvent: async (eventId: string): Promise<PrivateEvent[]> => {
    const response = await api.delete(`/private-event/${eventId}`);
    console.log("[DEBUG] Response from deleteEvent:", response.data);
    return response.data;
  },
};

export default communityApi;
