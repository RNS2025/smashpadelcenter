const axios = require("axios");

const API_BASE_URL = "https://api.rankedin.com/v1/";

const getAvailableTournaments = async (
  organisationId = "4310",
  isFinished = false,
  language = "en",
  skip = 0,
  take = 10
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}Organization/GetOrganisationEventsAsync`,
      {
        params: {
          organisationId: organisationId,
          IsFinished: isFinished,
          Language: language,
          skip: skip,
          take: take,
          _: Date.now(), // Add a timestamp to avoid caching issues
        },
      }
    );
    const tournaments = response.data;

    return tournaments;
  } catch (error) {
    console.error("Error fetching tournaments:", error.message);
    throw new Error("Failed to fetch tournaments");
  }
};

const getAllTournamentPlayers = async (tournamentId, language = "en") => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}tournament/GetAllSeedsAsync`,
      {
        params: {
          tournamentid: tournamentId,
          language: language,
        },
      }
    );
    const players = response.data;

    const mappedPlayers = players.map((player) => ({
      Name: player.Name,
      RankedInId: player.RankedinId,
    }));

    return mappedPlayers;
  } catch (error) {
    console.error("Error fetching tournament players:", error.message);
    throw new Error("Failed to fetch tournament players");
  }
};
const getAllRows = async (tournamentId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}tournament/GetPlayersTabAsync`,
      {
        params: {
          id: tournamentId,
        },
      }
    );
    const rows = response.data;

    return rows;
  } catch (error) {
    console.error("Error fetching rows:", error.message);
    throw new Error("Failed to fetch rows");
  }
};

const getPlayersInRow = async (
  tournamentId,
  tournamentClassId,
  language = "en"
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}tournament/GetPlayersForClassAsync`,
      {
        params: {
          tournamentId: tournamentId,
          tournamentClassId: tournamentClassId,
          language: language,
        },
      }
    );
    const data = response.data;

    // Extract players from the nested structure
    const players = data.Participants.flatMap((participant) => [
      participant.Participant.FirstPlayer,
      participant.Participant.SecondPlayer,
    ]);

    // Map the players to a simpler format Name and RankedinId
    const mappedPlayers = players.map((player) => ({
      Name: player.Name,
      RankedInId: player.RankedinId,
    }));

    return mappedPlayers;
  } catch (error) {
    console.error("Error fetching players in row:", error.message);
    throw new Error("Failed to fetch players in row");
  }
};

module.exports = {
  getAllTournamentPlayers,
  getAllRows,
  getPlayersInRow,
  getAvailableTournaments,
};
