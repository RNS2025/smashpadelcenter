import api from "../api/api";
import Player from "../types/Player";
import Row from "../types/Row";
import Tournament from "../types/Tournament";
import Match from "../types/Match";
import TournamentWithPlayers from "../types/TournamentWithPlayers";
import CheckInStatus from "../types/CheckInStatus";
import CheckInUpdateRequest from "../types/CheckInUpdateRequest";
import BulkCheckInUpdateRequest from "../types/BulkCheckInUpdateRequest";
import PlayerData from "../types/PlayerData.ts";

const rankedInService = {
  // Fetch all available tournaments
  getAvailableTournaments: async ({
    organisationId = "4310", // Optional with default empty string
    isFinished = false, // Optional with default false
    language = "en", // Optional with default 'en'
    //TODO: Er det muligt at bruge "da"?
    skip = 0, // Optional with default 0
    take = 10, // Optional with default 10
  }: {
    organisationId?: string; // Optional
    isFinished?: boolean; // Optional
    language?: string; // Optional
    skip?: number; // Optional
    take?: number; // Optional
  } = {}): Promise<Tournament[]> => {
    try {
      const response = await api.get("/GetAvailableTournaments", {
        params: { organisationId, isFinished, language, skip, take },
      });

      // Mapping the response payload into the Tournament type
      return response.data.payload.map((tournament: any) => ({
        eventId: tournament.eventId,
        eventName: tournament.eventName,
        eventUrl: tournament.eventUrl,
        club: tournament.club,
        city: tournament.city,
        isPremium: tournament.isPremium,
        startDate: new Date(tournament.startDate),
        endDate: new Date(tournament.endDate),
        eventState: tournament.eventState,
        joinUrl: tournament.joinUrl,
      }));
    } catch (error) {
      console.error("Error fetching available tournaments:", error);
      throw error;
    }
  },

  getAllRows: async (tournamentId: string): Promise<Row[]> => {
    try {
      const response = await api.get("/GetAllRows", {
        params: { id: tournamentId },
      });

      return response.data.map((row: any) => ({
        Name: row.Name,
        Id: row.Id,
      }));
    } catch (error) {
      console.error("Error fetching rows:", error);
      throw error;
    }
  },

  getPlayersInRow: async ({
    tournamentId,
    tournamentClassId,
    language = "en",
  }: {
    tournamentId: string;
    tournamentClassId: string;
    language?: string;
  }): Promise<Player[]> => {
    try {
      const response = await api.get("/GetPlayersInRow", {
        params: { tournamentId, tournamentClassId, language },
      });

      return response.data.map((player: any) => ({
        Name: player.Name,
        RankedInId: player.RankedInId,
      }));
    } catch (error) {
      console.error("Error fetching players in row:", error);
      throw error;
    }
  },

  getCheckInStatus: async (
    tournamentId: string,
    rowId: string
  ): Promise<CheckInStatus[]> => {
    try {
      const response = await api.get("/check-in/status", {
        params: { tournamentId, rowId },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching check-in status:", error);
      throw error;
    }
  },

  updateCheckInStatus: async (request: CheckInUpdateRequest): Promise<void> => {
    try {
      await api.post("/check-in/update", request);
    } catch (error) {
      console.error("Error updating check-in status:", error);
      throw error;
    }
  },

  bulkUpdateCheckInStatus: async (
    request: BulkCheckInUpdateRequest
  ): Promise<void> => {
    try {
      await api.post("/check-in/bulk-update", request);
    } catch (error) {
      console.error("Error bulk updating check-in status:", error);
      throw error;
    }
  },

  getTournamentWithPlayers: async (): Promise<TournamentWithPlayers[]> => {
    try {
      // Fetch tournaments
      const tournaments = await rankedInService.getAvailableTournaments({
        isFinished: false,
        language: "en",
      });

      // Initialize an array to hold tournaments with players
      const tournamentsWithPlayers: TournamentWithPlayers[] = [];

      // Loop through each tournament to fetch rows and players
      for (const tournament of tournaments) {
        const rows: { row: Row; players: Player[] }[] = [];

        // Fetch rows for the current tournament
        const tournamentRows = await rankedInService.getAllRows(
          tournament.eventId.toString()
        );

        for (const row of tournamentRows) {
          // Fetch players in the current row
          const players = await rankedInService.getPlayersInRow({
            tournamentId: tournament.eventId.toString(),
            tournamentClassId: row.Id.toString(),
            language: "en",
          });

          // Push the row and its players to the rows array
          rows.push({
            row,
            players,
          });
        }

        // Push the tournament along with its rows and players to the final array
        tournamentsWithPlayers.push({
          tournament,
          rows,
        });
      }

      return tournamentsWithPlayers;
    } catch (error) {
      console.error("Error fetching tournament data:", error);
      throw error;
    }
  },

  getPlayerMatches: async ({
    playerId,
    rowId,
    drawStrength = 0,
    drawStage = 0,
    language = "en",
  }: {
    playerId: string;
    rowId: string;
    drawStrength?: number;
    drawStage?: number;
    language?: string;
  }): Promise<Match[]> => {
    try {
      const response = await api.get("/GetPlayersMatches", {
        params: {
          playerId,
          rowId,
          drawStrength,
          drawStage,
          language,
        },
      });

      return response.data.map((match: any) => ({
        matchId: match.matchId,
        round: match.round,
        date: match.date ? new Date(match.date) : null,
        courtName: match.courtName,
        durationMinutes: match.durationMinutes,
        challenger: {
          firstPlayer: match.challenger.firstPlayer,
          secondPlayer: match.challenger.secondPlayer || null,
        },
        challenged: {
          firstPlayer: match.challenged.firstPlayer,
          secondPlayer: match.challenged.secondPlayer || null,
        },
        score: match.score,
        isPlayed: match.isPlayed,
        winnerParticipantId: match.winnerParticipantId,
        matchType: match.matchType,
      }));
    } catch (error) {
      console.error("Error fetching player matches:", error);
      throw error;
    }
  },
  getPlayerDetails: async (playerId: string): Promise<PlayerData> => {
    try {
      const response = await api.get("/GetPlayerDetails", {
        params: { playerId },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching player details:", error);
      throw error;
    }
  },
  //TODO: Skal [] ikke fjernes fra return type?
  getUpcomingTournament: async (): Promise<Tournament[]> => {
    try {
      const response = await api.get("/GetUpcomingTournament", {
        params: { organisationId: "4310" },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching upcoming tournaments:", error);
      throw error;
    }
  },
};

export default rankedInService;
