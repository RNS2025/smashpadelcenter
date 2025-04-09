const axios = require("axios");

const API_BASE_URL = "https://api.rankedin.com/v1/";
const OrganisationIdSmashHorsens = "4310";
const OrganisationIdSmashStensballe = "9492";

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

const getPlayersMatches = async (
  playerId,
  tournamentClassId,
  drawStrength = 0,
  drawStage = 0,
  language = "en"
) => {
  try {
    // Fetch all matches from the tournament
    const response = await axios.get(
      `${API_BASE_URL}tournament/GetDrawsForStageAndStrengthAsync`,
      {
        params: {
          tournamentClassId,
          drawStrength,
          drawStage,
          isReadonly: true,
          language,
        },
      }
    );

    const allMatches = response.data;
    let playerMatches = [];

    // Process matches based on BaseType
    allMatches.forEach((tournamentData) => {
      switch (tournamentData.BaseType) {
        case "Elimination":
          const eliminationMatches = (
            tournamentData.Elimination?.DrawData || []
          )
            .flat()
            .flat()
            .filter((match) => {
              const playersInvolved = [
                match?.ChallengerParticipant?.FirstPlayer,
                match?.ChallengerParticipant?.SecondPlayer,
                match?.ChallengedParticipant?.FirstPlayer,
                match?.ChallengedParticipant?.SecondPlayer,
              ].filter((player) => player?.RankedinId);

              return playersInvolved.some(
                (player) => player.RankedinId === playerId
              );
            })
            .map((match) => ({
              matchId: match.MatchId,
              round: match.Round,
              date: match.Date,
              courtName: match.CourtName,
              durationMinutes:
                match.MatchViewModel?.TotalDurationInMinutes || null,
              challenger: {
                firstPlayer: match.ChallengerParticipant.FirstPlayer,
                secondPlayer: match.ChallengerParticipant.SecondPlayer || null,
              },
              challenged: {
                firstPlayer: match.ChallengedParticipant.FirstPlayer,
                secondPlayer: match.ChallengedParticipant.SecondPlayer || null,
              },
              score: match.MatchViewModel.Score,
              isPlayed: match.MatchViewModel.IsPlayed,
              winnerParticipantId: match.WinnerParticipantId,
              matchType: "Elimination",
            }));

          playerMatches = playerMatches.concat(eliminationMatches);
          break;

        case "RoundRobin":
          const poolData = tournamentData.RoundRobin?.Pool || [];
          const participants = [];
          const matchesById = new Map();

          // Step 1: Collect all participants and their indices
          poolData.flat().forEach((cell) => {
            if (
              cell.CellType === "ParticipantCell" &&
              cell.ParticipantCell?.Players
            ) {
              participants.push({
                index: cell.ParticipantCell.Index,
                players: cell.ParticipantCell.Players,
              });
            }
          });

          // Step 2: Collect all matches and store them by MatchId
          poolData.forEach((row) => {
            row.forEach((cell) => {
              if (cell.CellType === "MatchCell" && cell.MatchCell?.MatchId) {
                matchesById.set(cell.MatchCell.MatchId, cell.MatchCell);
              }
            });
          });

          // Step 3: Determine matches for the player
          const playerParticipant = participants.find((p) =>
            p.players.some((player) => player.RankedinId === playerId)
          );

          if (playerParticipant) {
            const playerIndex = playerParticipant.index;
            const roundRobinMatches = [];

            poolData.forEach((row, rowIndex) => {
              if (rowIndex === 0) return; // Skip header row

              const rowParticipant = row[0]?.ParticipantCell;
              if (!rowParticipant) return;

              const rowIndexParticipant = rowParticipant.Index;
              if (rowIndexParticipant === playerIndex) return; // Skip player's own row

              row.forEach((cell, colIndex) => {
                if (cell.CellType === "MatchCell" && cell.MatchCell?.MatchId) {
                  const match = cell.MatchCell;
                  const opponentIndex = participants[colIndex - 1]?.index;

                  if (
                    opponentIndex === playerIndex ||
                    rowIndexParticipant === playerIndex
                  ) {
                    const challenger =
                      rowIndexParticipant === playerIndex
                        ? playerParticipant
                        : participants.find(
                            (p) => p.index === rowIndexParticipant
                          );
                    const challenged =
                      opponentIndex === playerIndex
                        ? playerParticipant
                        : participants[colIndex - 1];

                    roundRobinMatches.push({
                      matchId: match.MatchId,
                      round: rowIndex, // Using row index as a proxy for round
                      date: match.Date || null,
                      courtName: match.Court || null,
                      durationMinutes:
                        match.MatchResults?.TotalDurationInMinutes || null,
                      challenger: {
                        firstPlayer: challenger.players[0],
                        secondPlayer: challenger.players[1] || null,
                      },
                      challenged: {
                        firstPlayer: challenged.players[0],
                        secondPlayer: challenged.players[1] || null,
                      },
                      score: match.MatchResults?.Score || null,
                      isPlayed: match.MatchResults?.IsPlayed || false,
                      winnerParticipantId: match.MatchResults
                        ?.IsFirstParticipantWinner
                        ? rowIndexParticipant
                        : null, // Simplified winner logic
                      matchType: "RoundRobin",
                    });
                  }
                }
              });
            });

            playerMatches = playerMatches.concat(roundRobinMatches);
          }
          break;

        default:
          console.warn(`Unsupported BaseType: ${tournamentData.BaseType}`);
          break;
      }
    });

    // Sort matches by date if available
    playerMatches.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date) - new Date(b.date);
    });

    return playerMatches;
  } catch (error) {
    console.error("Error fetching matches for player:", error.message);
    throw new Error("Failed to fetch matches for player");
  }
};

const getPlayerDetails = async (playerId, language = "en") => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}player/playerprofileinfoasync`,
      {
        params: {
          rankedinId: playerId,
          language: language,
        },
      }
    );

    const playerData = response.data;

    return playerData;
  } catch (error) {
    console.error("Error fetching player details:", error.message);
    throw new Error("Failed to fetch player details");
  }
};

module.exports = {
  getAllTournamentPlayers,
  getAllRows,
  getPlayersInRow,
  getAvailableTournaments,
  getPlayersMatches,
  getPlayerDetails,
  API_BASE_URL,
  OrganisationIdSmashHorsens,
  OrganisationIdSmashStensballe,
};
