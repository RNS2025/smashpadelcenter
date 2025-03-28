import api from "../api/api";
import Player from "../types/Player";
import Row from "../types/Row";
import Tournament from "../types/Tournament";
import TournamentWithPlayers from "../types/TournamentWithPlayers";

const rankedInService = {
  // Fetch all available tournaments
  getAvailableTournaments: async ({
    organisationId = "4310", // Optional with default empty string
    isFinished = false, // Optional with default false
    language = "en", // Optional with default 'en'
    skip = 0, // Optional with default 0
    take = 10, // Optional with default 10
  }: {
    organisationId?: string; // Optional
    isFinished?: boolean; // Optional
    language?: string; // Optional
    skip?: number; // Optional
    take?: number; // Optional
  } = {}): Promise<Tournament[]> => {
    // Default empty object to make the entire argument optional
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

  // Fetch all rows for a given tournament
  getAllRows: async (tournamentId: string): Promise<Row[]> => {
    try {
      const response = await api.get("/GetAllRows", {
        params: { id: tournamentId },
      });

      // Mapping rows into the Row type
      return response.data.map((row: any) => ({
        Name: row.Name,
        Id: row.Id,
      }));
    } catch (error) {
      console.error("Error fetching rows:", error);
      throw error;
    }
  },

  // Fetch players in a specific row
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

      // Mapping players into the Player type
      return response.data.map((player: any) => ({
        Name: player.Name,
        RankedInId: player.RankedInId,
      }));
    } catch (error) {
      console.error("Error fetching players in row:", error);
      throw error;
    }
  },

  // Combine tournament, rows, and players into one structure
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
};

export default rankedInService;
