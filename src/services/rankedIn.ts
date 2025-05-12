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
import DpfMatch from "../types/DpfMatch.ts";
import { getLastMonday } from "../utils/dateUtils.ts";

const rankedInService = {
  // Fetch all available tournaments
  getAvailableTournaments: async ({
    organisationId = "4310", // Optional with default empty string
    isFinished = false, // Optional with default false
    language = "dk", // Optional with default 'en'
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
        Name: `${player.firstName} ${player.lastName}`,
        RankedInId: player.rankedInId,
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
  getPlayerDetails: async (
    playerId: string,
    language = "dk"
  ): Promise<PlayerData | null> => {
    try {
      const response = await api.get("/GetPlayerDetails", {
        params: { playerId, language },
      });
      if (!response.data) {
        throw new Error("No player data returned");
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching player details:", error);
      throw error;
    }
  },
  getUpcomingTournament: async (): Promise<Tournament> => {
    try {
      const response = await api.get("/GetUpcomingTournament", {
        params: { organisationId: "4310" },
      });
      return response.data.payload[0];
    } catch (error) {
      console.error("Error fetching upcoming tournaments:", error);
      throw error;
    }
  },
  getOnGoingMatchAndUpcommingMatch: async (
    tournamentId: string,
    courtName: string
  ): Promise<{
    ongoingMatch: DpfMatch | null;
    upcomingMatch: DpfMatch | null;
    secondUpcomingMatch?: DpfMatch | null;
  }> => {
    try {
      const response = await api.get("/GetOnGoingMatchAndUpcommingMatch", {
        params: {
          tournamentId: tournamentId,
          courtName: courtName,
        },
      });

      // Extract the matches from the response
      const matches = response.data.Matches || [];

      // Find matches for the specified court
      const courtMatches = matches.filter(
        (match: any) =>
          match.Court &&
          match.Court.toLowerCase().includes(courtName.toLowerCase())
      );

      // Determine current match and next match
      const now = new Date();
      const MATCH_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds

      // Find current match (ongoing)
      const ongoingMatch =
        courtMatches.find((match: any) => {
          if (!match.Date) return false;
          const startTime = new Date(match.Date);
          const endTime = new Date(startTime.getTime() + MATCH_DURATION_MS);
          return startTime <= now && endTime >= now;
        }) || null;

      // Find next match (upcoming)
      // Find next two matches (upcoming)
      const upcomingMatches = courtMatches
        .filter((match: any) => match.Date && new Date(match.Date) > now)
        .sort(
          (a: any, b: any) =>
            new Date(a.Date).getTime() - new Date(b.Date).getTime()
        );

      const upcomingMatch = upcomingMatches[0] || null;
      const secondUpcomingMatch = upcomingMatches[1] || null;
      // If no current match is found but there's an upcoming match in the API response
      // and it matches our court, use it as the upcomingMatch
      if (
        !ongoingMatch &&
        !upcomingMatch &&
        response.data.upcomingMatch &&
        response.data.upcomingMatch.Court &&
        response.data.upcomingMatch.Court.toLowerCase().includes(
          courtName.toLowerCase()
        )
      ) {
        return {
          ongoingMatch: null,
          upcomingMatch: response.data.upcomingMatch,
          secondUpcomingMatch: null,
        };
      }

      return { ongoingMatch, upcomingMatch, secondUpcomingMatch };
      return { ongoingMatch, upcomingMatch, secondUpcomingMatch };
    } catch (error) {
      console.error("Error fetching current and next match:", error);
      throw error;
    }
  },

  searchPlayer: async (searchTerm: string) => {
    try {
      const response = await api.get("/search-player", {
        params: {
          searchTerm,
          rankingId: 2032,
          rankingType: 3,
          ageGroup: 82,
          rankingDate: getLastMonday().toISOString().split("T")[0],
        },
      });

      return response.data.map((player: any) => ({
        participantId: player.participantId,
        participantName: player.participantName,
        points: player.points,
        standing: player.standing,
        participantUrl: player.participantUrl,
      }));
    } catch (error) {
      console.error("Error searching player:", error);
      throw error;
    }
  },
};

export default rankedInService;
