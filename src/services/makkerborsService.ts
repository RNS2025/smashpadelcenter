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

  updateMatch: async (
    matchId: string,
    update: Partial<Omit<PadelMatch, "id">>
  ): Promise<PadelMatch> => {
    const response = await api.patch(`/matches/${matchId}`, update);
    return response.data;
  },

  joinMatch: async (matchId: string, username: string): Promise<PadelMatch> => {
    const response = await api.post(`/matches/${matchId}/join`, { username });
    return response.data;
  },

  playerCancelJoinMatch: async (
    matchId: string,
    username: string
  ): Promise<PadelMatch> => {
    const response = await api.post(`/matches/${matchId}/player-cancel`, {
      username,
    });
    return response.data;
  },

  rejectJoinMatch: async (
    matchId: string,
    username: string
  ): Promise<PadelMatch> => {
    const response = await api.post(`/matches/${matchId}/reject`, {
      username,
    });
    return response.data;
  },

  acceptJoinMatch: async (
    matchId: string,
    username: string
  ): Promise<PadelMatch> => {
    const response = await api.post(`/matches/${matchId}/accept`, {
      username,
    });
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

  removePlayer: async (
    matchId: string,
    username: string
  ): Promise<PadelMatch> => {
    const response = await api.post(`/matches/${matchId}/remove-player`, {
      username,
    });
    return response.data;
  },

  removeReservedPlayer: async (
    matchId: string,
    username: string
  ): Promise<PadelMatch> => {
    const response = await api.post(
      `/matches/${matchId}/remove-reserved-player`,
      {
        username,
      }
    );
    return response.data;
  },

  invitedPlayersToMatch: async (
    matchId: string,
    usernames: string[]
  ): Promise<PadelMatch> => {
    const response = await api.post(`/matches/${matchId}/invite`, {
      usernames,
    });
    return response.data;
  },

  submitMatchResult: async (
    matchId: string,
    matchResult: Partial<Omit<PadelMatch, "id">>
  ): Promise<PadelMatch> => {
    const response = await api.patch(`/matches/${matchId}/result`, matchResult);
    return response.data;
  },

  submitConfirmResult: async (
    matchId: string,
    matchResult: Partial<Omit<PadelMatch, "id">>
  ): Promise<PadelMatch> => {
    const response = await api.patch(
      `/matches/${matchId}/confirm-result`,
      matchResult
    );
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
  getPrivateEvents: async (): Promise<PrivateEvent[]> => {
    const response = await api.get("/private-event");
    return response.data;
  },
  getPrivateEventsForUser: async (
    username: string
  ): Promise<PrivateEvent[]> => {
    const response = await api.get(`/private-event/${username}`);
    return response.data;
  },
  getEventById: async (eventId: string): Promise<PrivateEvent> => {
    const response = await api.get(`/private-event/event/${eventId}`);
    return response.data;
  },
  createPrivateEvent: async (
    privateEvent: Omit<PrivateEvent, "id">
  ): Promise<PrivateEvent> => {
    const response = await api.post("/private-event", privateEvent);
    return response.data;
  },
  updatePrivateEvent: async (
    eventId: string,
    update: Partial<Omit<PrivateEvent, "id">>
  ): Promise<PrivateEvent> => {
    const response = await api.patch(`/private-event/${eventId}`, update);
    return response.data;
  },
  removePlayerFromEvent: async (
    eventId: string,
    username: string
  ): Promise<PrivateEvent> => {
    const response = await api.post(`/private-event/${eventId}/remove-player`, {
      username,
    });
    return response.data;
  },
  joinEvent: async (
    eventId: string,
    username: string
  ): Promise<PrivateEvent> => {
    const response = await api.post(`/private-event/${eventId}/join`, {
      username,
    });
    return response.data;
  },
  confirmJoinEvent: async (
    eventId: string,
    username: string
  ): Promise<PrivateEvent> => {
    const response = await api.post(`/private-event/${eventId}/confirm`, {
      username,
    });
    return response.data;
  },

  confirmAcceptPrivateEvent: async (
    eventId: string,
    username: string
  ): Promise<PrivateEvent> => {
    const response = await api.post(`/private-event/${eventId}/confirm`, {
      username,
    });
    return response.data;
  },

  confirmDeclinePrivateEvent: async (
    eventId: string,
    username: string
  ): Promise<PrivateEvent> => {
    const response = await api.post(`/private-event/${eventId}/decline`, {
      username,
    });
    return response.data;
  },

  deleteEvent: async (eventId: string): Promise<PrivateEvent[]> => {
    const response = await api.delete(`/private-event/${eventId}`);
    return response.data;
  },
  invitedPlayersToEvent: async (
    eventId: string,
    usernames: string[]
  ): Promise<PrivateEvent> => {
    const response = await api.post(`/private-event/${eventId}/invite`, {
      usernames,
    });
    return response.data;
  },

  playerCancelJoinEvent: async (
    eventId: string,
    username: string
  ): Promise<PrivateEvent> => {
    const response = await api.post(`/private-event/${eventId}/player-cancel`, {
      username,
    });
    return response.data;
  },
};

export default communityApi;
