import api from "../api/api";
import axios from "axios";
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
import { MatchScore } from "../types/Match.ts";

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
    rankedInId: string,
    language = "dk"
  ): Promise<PlayerData | null> => {
    try {
      const response = await api.get("/GetPlayerDetails", {
        params: { rankedInId, language },
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

  saveMatchResult: async (matchResult: {
    matchId: number;
    sets: { player1: string; player2: string }[];
    tiebreak?: { player1: string; player2: string };
  }): Promise<any> => {
    try {
      const response = await api.post("/SaveMatchResult", matchResult);
      return response.data;
    } catch (error) {
      console.error("Error saving match result:", error);
      throw error;
    }
  },

  getAllDPFMatchResults: async (): Promise<any[]> => {
    try {
      const response = await api.get("/GetAllDPFMatchResults");
      return response.data;
    } catch (error) {
      console.error("Error fetching all DPF match results:", error);
      throw error;
    }
  },
  getParticipatedEvents: async (
    playerId: number,
    language: string
  ): Promise<Event[]> => {
    const response = await axios.get(
      `https://api.rankedin.com/v1/player/ParticipatedEventsAsync?playerId=${playerId}&language=${language}&skip=0&take=10`
    );
    return response.data;
  },

  getEventMatches: async (
    eventId: number,
    language: string
  ): Promise<Match[]> => {
    const response = await axios.get(
      `https://api.rankedin.com/v1/tournament/GetMatchesSectionAsync?Id=${eventId}&LanguageCode=${language}&IsReadonly=true`
    );
    return response.data;
  },

  getSpecificDPFMatchResult: async (
    matchId: number
  ): Promise<{
    matchId: number;
    score: MatchScore | null;
    isPlayed: boolean;
  }> => {
    try {
      const response = await api.get("/GetSpecificDPFMatchResult", {
        params: { matchId },
      });
      console.log(
        `[DEBUG] Raw API response for match ${matchId}:`,
        response.data
      );
      const rawResult = response.data;

      // Check if the response has sets (indicating a result exists)
      if (!rawResult || !rawResult.sets || rawResult.sets.length === 0) {
        console.log(`[DEBUG] No valid result for match ${matchId}:`, rawResult);
        return { matchId, score: null, isPlayed: false };
      }

      // Transform the database document into MatchScore
      const score: MatchScore = {
        FirstParticipantScore: parseInt(
          rawResult.sets[rawResult.sets.length - 1].player1
        ),
        SecondParticipantScore: parseInt(
          rawResult.sets[rawResult.sets.length - 1].player2
        ),
        LoserTiebreak: rawResult.tiebreak
          ? parseInt(rawResult.tiebreak.player1)
          : null,
        DetailedScoring: rawResult.sets.map(
          (set: { player1: string; player2: string }) => ({
            FirstParticipantScore: parseInt(set.player1),
            SecondParticipantScore: parseInt(set.player2),
            LoserTiebreak: null,
            DetailedScoring: null,
            IsFirstParticipantWinner:
              parseInt(set.player1) > parseInt(set.player2),
            LabelClass: "",
          })
        ),
        IsFirstParticipantWinner:
          parseInt(rawResult.sets[rawResult.sets.length - 1].player1) >
          parseInt(rawResult.sets[rawResult.sets.length - 1].player2),
        LabelClass: "",
      };

      return {
        matchId,
        score,
        isPlayed: true, // Result exists, so the match is played
      };
    } catch (error: any) {
      console.error(
        `[DEBUG] Error fetching match result for ${matchId}:`,
        error.message,
        error.response?.data
      );
      return { matchId, score: null, isPlayed: false };
    }
  },
};

export default rankedInService;
