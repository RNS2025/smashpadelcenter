const axios = require("axios");
const mongoose = require("mongoose");
const { Tournament, Player } = require("../models/rankedInModels");
const { MatchResult } = require("../models/resultsModel");
const logger = require("../config/logger");
const API_BASE_URL = "https://api.rankedin.com/v1/";
const OrganisationIdSmashHorsens = "4310";
const OrganisationIdSmashStensballe = "9492";

// Debug: Verify model import
logger.debug(
  "Tournament model: " +
    typeof Tournament +
    ", Player model: " +
    typeof Player +
    ", MatchResult model: " +
    typeof MatchResult
);

const getAvailableTournaments = async (
  organisationId = "4310",
  isFinished = false,
  language = "en",
  skip = 0,
  take = 10
) => {
  logger.info(
    `Checking MongoDB for tournaments: org ${organisationId}, isFinished ${isFinished}`
  );
  const tournaments = await Tournament.find({
    organisationId,
    isFinished,
  }).lean();
  if (tournaments.length > 0) {
    logger.info(`Using DB tournaments for org ${organisationId}`);
    return {
      payload: tournaments.map((t) => ({
        eventId: t.eventId,
        eventName: t.eventName,
        eventUrl: t.eventUrl,
        club: t.club,
        city: t.city,
        isPremium: t.isPremium,
        startDate: t.startDate,
        endDate: t.endDate,
        eventState: t.eventState,
        joinUrl: t.joinUrl,
      })),
    };
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}Organization/GetOrganisationEventsAsync`,
      {
        params: {
          organisationId,
          IsFinished: isFinished,
          Language: language,
          skip,
          take,
          _: Date.now(),
        },
      }
    );
    const data = response.data;
    logger.info(`API response for org ${organisationId}:`, {
      payloadLength: data.payload?.length || 0,
    });

    if (!data.payload || data.payload.length === 0) {
      logger.warn(`No tournaments returned from API for org ${organisationId}`);
      return { payload: [] };
    }

    await Tournament.deleteMany({ organisationId, isFinished });
    const tournamentDocs = data.payload.map((tournament) => ({
      organisationId,
      eventId: tournament.eventId,
      eventName: tournament.eventName,
      eventUrl: tournament.eventUrl || "",
      club: tournament.club || "",
      city: tournament.city || "",
      isPremium: tournament.isPremium || false,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      eventState: tournament.eventState || 0,
      joinUrl: tournament.joinUrl || "",
      updatedAt: new Date(),
    }));
    await Tournament.insertMany(tournamentDocs);

    logger.info(
      `Saved ${tournamentDocs.length} tournaments for org ${organisationId}`
    );
    return {
      payload: tournamentDocs.map((t) => ({
        eventId: t.eventId,
        eventName: t.eventName,
        eventUrl: t.eventUrl,
        club: t.club,
        city: t.city,
        isPremium: t.isPremium,
        startDate: t.startDate,
        endDate: t.endDate,
        eventState: t.eventState,
        joinUrl: t.joinUrl,
      })),
    };
  } catch (error) {
    logger.error(`Error fetching tournaments for org ${organisationId}:`, {
      error: error.message,
    });
    return { payload: [] };
  }
};

const getUpcomingTournament = async (
  organisationId = "4310",
  language = "en"
) => {
  try {
    logger.debug("Fetching upcoming tournament with params:", {
      organisationId,
      language,
    });
    const tournaments = await getAvailableTournaments(
      organisationId,
      false,
      language,
      0,
      1
    );
    return tournaments;
  } catch (error) {
    logger.error("Error fetching upcoming tournament:", error.message);
    return { payload: [] };
  }
};

const getAllTournamentPlayers = async (tournamentId, language = "en") => {
  if (!tournamentId) {
    logger.warn("Skipping getAllTournamentPlayers: tournamentId is undefined");
    return [];
  }

  const players = await Player.find({ tournamentId }).lean();
  if (players.length > 0) {
    logger.info(`Using DB players for tournament ${tournamentId}`);
    return players.map((p) => ({
      id: p.rankedInId,
      firstName: p.name.split(" ")[0] || "",
      lastName: p.name.split(" ").slice(1).join(" ") || "",
      rankedInId: p.rankedInId,
    }));
  }

  try {
    logger.info(`Fetching players for tournamentId ${tournamentId}`);
    const response = await axios.get(
      `${API_BASE_URL}tournament/GetAllSeedsAsync`,
      {
        params: { tournamentid: tournamentId, language },
      }
    );
    const playersData = response.data;

    await Player.deleteMany({ tournamentId });
    const playerDocs = playersData.map((player) => ({
      tournamentId,
      rankedInId: player.RankedinId,
      name: player.Name,
      updatedAt: new Date(),
    }));
    await Player.insertMany(playerDocs);

    logger.info(
      `Saved ${playerDocs.length} players for tournament ${tournamentId}`
    );
    return playerDocs.map((p) => ({
      id: p.rankedInId,
      firstName: p.name.split(" ")[0] || "",
      lastName: p.name.split(" ").slice(1).join(" ") || "",
      rankedInId: p.rankedInId,
    }));
  } catch (error) {
    logger.error(
      `Error fetching tournament players for tournamentId ${tournamentId}:`,
      {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      }
    );
    return [];
  }
};

const getAllRows = async (tournamentId) => {
  if (!tournamentId) {
    logger.warn("Skipping getAllRows: tournamentId is undefined");
    return [];
  }
  try {
    const response = await axios.get(
      `${API_BASE_URL}tournament/GetPlayersTabAsync`,
      {
        params: { id: tournamentId },
      }
    );
    const rows = response.data;
    return rows;
  } catch (error) {
    logger.error(
      `Error fetching rows for tournamentId ${tournamentId}:`,
      error.message
    );
    return [];
  }
};

const getPlayersInRow = async (
  tournamentId,
  tournamentClassId,
  language = "en"
) => {
  if (!tournamentId || !tournamentClassId) {
    logger.warn(
      "Skipping getPlayersInRow: invalid tournamentId or tournamentClassId"
    );
    return [];
  }
  try {
    const response = await axios.get(
      `${API_BASE_URL}tournament/GetPlayersForClassAsync`,
      {
        params: { tournamentId, tournamentClassId, language },
      }
    );
    const data = response.data;

    const players = data.Participants.flatMap((participant) => [
      participant.Participant.FirstPlayer,
      participant.Participant.SecondPlayer,
    ]).filter((player) => player);

    return players.map((player) => ({
      id: player.RankedinId,
      firstName: player.Name.split(" ")[0] || "",
      lastName: player.Name.split(" ").slice(1).join(" ") || "",
      rankedInId: player.RankedinId,
    }));
  } catch (error) {
    logger.error(
      `Error fetching players in row for tournamentId ${tournamentId}:`,
      error.message
    );
    return [];
  }
};

const getPlayersMatches = async (
  playerId,
  tournamentClassId,
  drawStrength = 0,
  drawStage = 0,
  language = "en"
) => {
  if (!playerId || !tournamentClassId) {
    logger.warn(
      "Skipping getPlayersMatches: invalid playerId or tournamentClassId"
    );
    return [];
  }
  try {
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

    allMatches.forEach((tournamentData) => {
      switch (tournamentData.BaseType) {
        case "Elimination":
          const eliminationMatches = (
            tournamentData.Elimination?.DrawData || []
          )
            .flat()
            .filter((match) => {
              if (!match) return false;
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
              date: match.Date || null,
              courtName: match.CourtName || null,
              durationMinutes:
                match.MatchViewModel?.TotalDurationInMinutes || null,
              challenger: {
                id: match.ChallengerParticipant?.RankedinId || "",
                firstPlayer: {
                  id:
                    match.ChallengerParticipant?.FirstPlayer?.RankedinId || "",
                  firstName:
                    match.ChallengerParticipant?.FirstPlayer?.Name?.split(
                      " "
                    )[0] || "",
                  lastName:
                    match.ChallengerParticipant?.FirstPlayer?.Name?.split(" ")
                      .slice(1)
                      .join(" ") || "",
                  Name:
                    `${
                      match.ChallengerParticipant?.FirstPlayer?.Name?.split(
                        " "
                      )[0] || ""
                    } ${
                      match.ChallengerParticipant?.FirstPlayer?.Name?.split(" ")
                        .slice(1)
                        .join(" ") || ""
                    }`.trim() || "",
                  rankedInId:
                    match.ChallengerParticipant?.FirstPlayer?.RankedinId || "",
                },
                secondPlayer: match.ChallengerParticipant?.SecondPlayer
                  ? {
                      id:
                        match.ChallengerParticipant?.SecondPlayer?.RankedinId ||
                        "",
                      firstName:
                        match.ChallengerParticipant?.SecondPlayer?.Name?.split(
                          " "
                        )[0] || "",
                      lastName:
                        match.ChallengerParticipant?.SecondPlayer?.Name?.split(
                          " "
                        )
                          .slice(1)
                          .join(" ") || "",
                      Name:
                        `${
                          match.ChallengerParticipant?.SecondPlayer?.Name?.split(
                            " "
                          )[0] || ""
                        } ${
                          match.ChallengerParticipant?.SecondPlayer?.Name?.split(
                            " "
                          )
                            .slice(1)
                            .join(" ") || ""
                        }`.trim() || "",
                      rankedInId:
                        match.ChallengerParticipant?.SecondPlayer?.RankedinId ||
                        "",
                    }
                  : null,
              },
              challenged: {
                id: match.ChallengedParticipant?.RankedinId || "",
                firstPlayer: {
                  id:
                    match.ChallengedParticipant?.FirstPlayer?.RankedinId || "",
                  firstName:
                    match.ChallengedParticipant?.FirstPlayer?.Name?.split(
                      " "
                    )[0] || "",
                  lastName:
                    match.ChallengedParticipant?.FirstPlayer?.Name?.split(" ")
                      .slice(1)
                      .join(" ") || "",
                  Name:
                    `${
                      match.ChallengedParticipant?.FirstPlayer?.Name?.split(
                        " "
                      )[0] || ""
                    } ${
                      match.ChallengedParticipant?.FirstPlayer?.Name?.split(" ")
                        .slice(1)
                        .join(" ") || ""
                    }`.trim() || "",
                  rankedInId:
                    match.ChallengedParticipant?.FirstPlayer?.RankedinId || "",
                },
                secondPlayer: match.ChallengedParticipant?.SecondPlayer
                  ? {
                      id:
                        match.ChallengedParticipant?.SecondPlayer?.RankedinId ||
                        "",
                      firstName:
                        match.ChallengedParticipant?.SecondPlayer?.Name?.split(
                          " "
                        )[0] || "",
                      lastName:
                        match.ChallengedParticipant?.SecondPlayer?.Name?.split(
                          " "
                        )
                          .slice(1)
                          .join(" ") || "",
                      Name:
                        `${
                          match.ChallengedParticipant?.SecondPlayer?.Name?.split(
                            " "
                          )[0] || ""
                        } ${
                          match.ChallengedParticipant?.SecondPlayer?.Name?.split(
                            " "
                          )
                            .slice(1)
                            .join(" ") || ""
                        }`.trim() || "",
                      rankedInId:
                        match.ChallengedParticipant?.SecondPlayer?.RankedinId ||
                        "",
                    }
                  : null,
              },
              score: match.MatchViewModel?.Score || null,
              isPlayed: match.MatchViewModel?.IsPlayed || false,
              winnerParticipantId: match.WinnerParticipantId || null,
              matchType: "Elimination",
            }));

          playerMatches = playerMatches.concat(eliminationMatches);
          break;

        case "RoundRobin":
          const poolData = tournamentData.RoundRobin?.Pool || [];
          const participants = [];
          const matchesById = new Map();

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

          poolData.forEach((row) => {
            row.forEach((cell) => {
              if (cell.CellType === "MatchCell" && cell.MatchCell?.MatchId) {
                matchesById.set(cell.MatchCell.MatchId, cell.MatchCell);
              }
            });
          });

          const playerParticipant = participants.find((p) =>
            p.players.some((player) => player.RankedinId === playerId)
          );

          if (playerParticipant) {
            const playerIndex = playerParticipant.index;
            const roundRobinMatches = [];

            poolData.forEach((row, rowIndex) => {
              if (rowIndex === 0) return;

              const rowParticipant = row[0]?.ParticipantCell;
              if (!rowParticipant) return;

              const rowIndexParticipant = rowParticipant.Index;
              if (rowIndexParticipant === playerIndex) return;

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
                      round: rowIndex,
                      date: match.Date || null,
                      courtName: match.Court || null,
                      durationMinutes:
                        match.MatchResults?.TotalDurationInMinutes || null,
                      challenger: {
                        id: challenger?.players[0]?.RankedinId || "",
                        firstPlayer: {
                          id: challenger?.players[0]?.RankedinId || "",
                          firstName:
                            challenger?.players[0]?.Name.split(" ")[0] || "",
                          lastName:
                            challenger?.players[0]?.Name.split(" ")
                              .slice(1)
                              .join(" ") || "",
                          Name:
                            `${
                              challenger?.players[0]?.Name.split(" ")[0] || ""
                            } ${
                              challenger?.players[0]?.Name.split(" ")
                                .slice(1)
                                .join(" ") || ""
                            }`.trim() || "",
                          rankedInId: challenger?.players[0]?.RankedinId || "",
                        },
                        secondPlayer: challenger?.players[1]
                          ? {
                              id: challenger?.players[1]?.RankedinId || "",
                              firstName:
                                challenger?.players[1]?.Name.split(" ")[0] ||
                                "",
                              lastName:
                                challenger?.players[1]?.Name.split(" ")
                                  .slice(1)
                                  .join(" ") || "",
                              Name:
                                `${
                                  challenger?.players[1]?.Name.split(" ")[0] ||
                                  ""
                                } ${
                                  challenger?.players[1]?.Name.split(" ")
                                    .slice(1)
                                    .join(" ") || ""
                                }`.trim() || "",
                              rankedInId:
                                challenger?.players[1]?.RankedinId || "",
                            }
                          : null,
                      },
                      challenged: {
                        id: challenged?.players[0]?.RankedinId || "",
                        firstPlayer: {
                          id: challenged?.players[0]?.RankedinId || "",
                          firstName:
                            challenged?.players[0]?.Name.split(" ")[0] || "",
                          lastName:
                            challenged?.players[0]?.Name.split(" ")
                              .slice(1)
                              .join(" ") || "",
                          Name:
                            `${
                              challenged?.players[0]?.Name.split(" ")[0] || ""
                            } ${
                              challenged?.players[0]?.Name.split(" ")
                                .slice(1)
                                .join(" ") || ""
                            }`.trim() || "",
                          rankedInId: challenged?.players[0]?.RankedinId || "",
                        },
                        secondPlayer: challenged?.players[1]
                          ? {
                              id: challenged?.players[1]?.RankedinId || "",
                              firstName:
                                challenged?.players[1]?.Name.split(" ")[0] ||
                                "",
                              lastName:
                                challenged?.players[1]?.Name.split(" ")
                                  .slice(1)
                                  .join(" ") || "",
                              Name:
                                `${
                                  challenged?.players[1]?.Name.split(" ")[0] ||
                                  ""
                                } ${
                                  challenged?.players[1]?.Name.split(" ")
                                    .slice(1)
                                    .join(" ") || ""
                                }`.trim() || "",
                              rankedInId:
                                challenged?.players[1]?.RankedinId || "",
                            }
                          : null,
                      },
                      score: match.MatchResults?.Score || null,
                      isPlayed: match.MatchResults?.IsPlayed || false,
                      winnerParticipantId: match.MatchResults
                        ?.IsFirstParticipantWinner
                        ? rowIndexParticipant
                        : null,
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
          logger.warn(`Unsupported BaseType: ${tournamentData.BaseType}`);
          break;
      }
    });

    playerMatches.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date) - new Date(b.date);
    });

    return playerMatches;
  } catch (error) {
    logger.error(
      `Error fetching matches for playerId ${playerId}:`,
      error.message
    );
    return [];
  }
};

const getPlayerDetails = async (rankedInId, language = "en") => {
  if (!rankedInId) {
    logger.warn("Skipping getPlayerDetails: rankedIn Id is undefined");
    return null;
  }
  try {
    const response = await axios.get(
      `${API_BASE_URL}player/playerprofileinfoasync`,
      {
        params: { rankedInId, language },
      }
    );
    const playerData = response.data;
    return {
      Header: {
        PlayerId: playerData.Header.PlayerId,
        ImageThumbnailUrl: playerData.Header.ImageThumbnailUrl || "",
        FullName:
          playerData.Header.FirstName + " " + playerData.Header.LastName,
        RankedinId: playerData.Header.RankedinId,
        HomeClubName: playerData.Header.HomeClubName || "",
        HomeClubUrl: playerData.Header.HomeClubUrl || "",
        CountryShort: playerData.Header.CountryShort || "",
        Age: playerData.Header.Age || "",
        Form: playerData.Header.Form || [],
        IsProPlayer: playerData.Header.IsProPlayer || false,
      },
      Statistics: {
        WinLossDoublesCurrentYear:
          playerData.Statistics.WinLossDoublesCurrentYear || "",
        EventsParticipatedDoublesCurrentYear:
          playerData.Statistics.EventsParticipatedDoublesCurrentYear || "",
        CareerWinLossDoubles: playerData.Statistics.CareerWinLossDoubles || "",
        CareerEventsParticipatedDoubles:
          playerData.Statistics.CareerEventsParticipatedDoubles || "",
      },
    };
  } catch (error) {
    logger.error(
      `Error fetching player details for rankedInId ${rankedInId}:`,
      error.message
    );
    return null;
  }
};

const getAllMatches = async (tournamentId, language = "en") => {
  if (!tournamentId) {
    logger.warn("Skipping getAllMatches: tournamentId is undefined");
    return [];
  }
  try {
    const response = await axios.get(
      `${API_BASE_URL}tournament/GetMatchesAsync`,
      {
        params: { tournamentId, language },
      }
    );
    const matches = response.data;
    return matches;
  } catch (error) {
    logger.error(
      `Error fetching matches for tournamentId ${tournamentId}:`,
      error.message
    );
    return [];
  }
};

const getNextMatchAndUpcommingOnCourt = async (
  tournamentId,
  courtName,
  language = "en"
) => {
  try {
    logger.info(
      `Fetching next match and upcoming match on court ${courtName} for tournamentId ${tournamentId}`
    );

    const response = await axios.get(
      `${API_BASE_URL}tournament/GetMatchesSectionAsync`,
      {
        params: {
          Id: tournamentId,
          LanguageCode: language,
          IsReadonly: true,
        },
      }
    );

    const matches = response.data.Matches || [];
    if (!matches || matches.length === 0) {
      logger.info(`No matches found for tournamentId ${tournamentId}`);
      return { ongoingMatch: null, upcomingMatch: null };
    }
    const now = new Date();
    const courtNameLower = courtName.toLowerCase();
    const courtMatches = matches.filter(
      (match) =>
        match.Court && match.Court.toLowerCase().includes(courtNameLower)
    );

    const MATCH_DURATION_MS = 60 * 60 * 1000;
    const ongoingMatch = courtMatches.find((match) => {
      if (!match.Date) return false;
      const startTime = new Date(match.Date);
      const endTime = new Date(startTime.getTime() + MATCH_DURATION_MS);
      return startTime <= now && endTime >= now;
    });
    const upcomingMatch = courtMatches
      .filter((match) => match.Date && new Date(match.Date) > now)
      .sort((a, b) => new Date(a.Date) - new Date(b.Date))[0];

    return { ongoingMatch, upcomingMatch };
  } catch (error) {
    logger.error(
      `Error fetching next match on court for tournamentId ${tournamentId}:`,
      error.message
    );
    return { ongoingMatch: null, upcomingMatch: null };
  }
};

const searchPlayer = async (
  searchTerm,
  rankingId,
  rankingType,
  ageGroup,
  rankingDate
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}Ranking/SearchRankingPlayersAsync`,
      {
        params: {
          rankingId,
          rankingType,
          ageGroup,
          rankingDate,
          weekFromNow: 1,
          language: "en",
          searchTerm,
          skip: 0,
          take: 10,
          _: Date.now(),
        },
      }
    );

    const payload = response.data.Payload || [];

    let selectedPlayers = payload;

    if (payload.length > 1) {
      selectedPlayers = payload.filter(
        (player) =>
          player.HomeClubName &&
          player.HomeClubName.toLowerCase().includes(
            "smash padelcenter" ||
              player.HomeClubName.toLowerCase().includes("horsens") ||
              player.HomeClubName.toLowerCase().includes("8700")
          )
      );
    }

    const players = selectedPlayers.map((player) => ({
      participantId: player.Participant.Id,
      participantName: player.Name,
      points: player.ParticipantPoints?.Points ?? 0,
      standing: player.ParticipantPoints?.Standing ?? 0,
      participantUrl: player.ParticipantUrl,
    }));

    logger.info(
      `RankedInService: Found ${players.length} players after conditional filtering.`
    );

    return players;
  } catch (error) {
    logger.error("RankedInService: Error searching player", {
      error: error.message,
    });
    throw new Error("Could not search player: " + error.message);
  }
};

const saveMatchResult = async ({
  matchId,
  sets,
  tiebreak,
  tournamentName,
  row,
  players,
}) => {
  try {
    logger.info(`Attempting to save match result for matchId: ${matchId}`, {
      input: { matchId, setsCount: sets?.length, hasTiebreak: !!tiebreak },
    });

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error(
        `MongoDB not connected (readyState: ${mongoose.connection.readyState})`
      );
    }

    // Double-check MatchResult model
    if (!MatchResult) {
      logger.error("MatchResult model is undefined in saveMatchResult", {
        models: {
          Tournament: !!Tournament,
          Player: !!Player,
          MatchResult: !!MatchResult,
        },
      });
      throw new Error("MatchResult model is not available");
    }

    // Validate inputs
    if (!matchId || isNaN(parseInt(matchId))) {
      throw new Error("matchId must be a valid number");
    }
    if (!sets || !Array.isArray(sets)) {
      throw new Error("sets must be a non-empty array");
    }
    if (sets.length === 0) {
      throw new Error("At least one set is required");
    }

    // Validate sets
    const validatedSets = sets.map((set, index) => {
      if (!set || typeof set !== "object") {
        throw new Error(`Set ${index + 1} is invalid`);
      }
      const { player1, player2 } = set;
      if (!player1 || !player2) {
        throw new Error(`Set ${index + 1} must have scores for both players`);
      }
      const p1Score = parseInt(player1.trim());
      const p2Score = parseInt(player2.trim());
      if (isNaN(p1Score) || isNaN(p2Score)) {
        throw new Error(`Set ${index + 1} scores must be valid numbers`);
      }
      if (p1Score < 0 || p2Score < 0 || p1Score > 50 || p2Score > 50) {
        throw new Error(`Set ${index + 1} scores must be between 0 and 50`);
      }
      return { player1: p1Score.toString(), player2: p2Score.toString() };
    });

    // Validate tiebreak
    let validatedTiebreak = null;
    if (tiebreak) {
      if (!tiebreak.player1 || !tiebreak.player2) {
        throw new Error("Tiebreak must have scores for both players");
      }
      const tb1Score = parseInt(tiebreak.player1.trim());
      const tb2Score = parseInt(tiebreak.player2.trim());
      if (isNaN(tb1Score) || isNaN(tb2Score)) {
        throw new Error("Tiebreak scores must be valid numbers");
      }
      if (tb1Score < 0 || tb2Score < 0 || tb1Score > 50 || tb2Score > 50) {
        throw new Error("Tiebreak scores must be between 0 and 50");
      }
      validatedTiebreak = {
        player1: tb1Score.toString(),
        player2: tb2Score.toString(),
      };
    }

    // Convert matchId to Number to match schema
    const matchIdNum = parseInt(matchId);

    // Check if result already exists
    const existingResult = await MatchResult.findOne({ matchId: matchIdNum });
    if (existingResult) {
      throw new Error("Match result already exists for this matchId");
    }

    // Save to MongoDB with retry mechanism
    let saveAttempts = 0;
    const maxRetries = 2;
    while (saveAttempts <= maxRetries) {
      try {
        const validatedPlayers = {
          ...players,
        };

        const matchResult = new MatchResult({
          matchId: matchIdNum,
          sets: validatedSets,
          tiebreak: validatedTiebreak,
          tournamentName,
          row,
          players: validatedPlayers,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await matchResult.save();
        logger.info(
          `Successfully saved match result for matchId: ${matchIdNum}`
        );
        return {
          matchId: matchIdNum,
          sets: validatedSets,
          tiebreak: validatedTiebreak,
          tournamentName,
          row,
          players: validatedPlayers,
        };
      } catch (saveError) {
        saveAttempts++;
        if (saveAttempts > maxRetries) {
          throw saveError;
        }
        logger.warn(`Retry attempt ${saveAttempts} for matchId: ${matchIdNum}`);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }
  } catch (error) {
    const errorMessage = error.message || "Unknown error";
    const errorDetails = {
      message: errorMessage,
      stack: error.stack,
      input: { matchId, setsCount: sets?.length, hasTiebreak: !!tiebreak },
    };
    if (error.name === "MongoServerError" && error.code === 11000) {
      errorDetails.message = "Duplicate matchId detected";
    }
    logger.error(
      `Error saving match result for matchId: ${matchId}:`,
      errorDetails
    );
    throw new Error(errorDetails.message);
  }
};

const getAllDPFMatchResults = async () => {
  try {
    logger.info("Attempting to retrieve all DPF match results");
    // Double-check MatchResult model
    if (!MatchResult) {
      logger.error("MatchResult model is undefined in getAllMatchResults", {
        models: {
          Tournament: !!Tournament,
          Player: !!Player,
          MatchResult: !!MatchResult,
        },
      });
      throw new Error("MatchResult model is not available");
    }

    // Retrieve all match results
    const results = await MatchResult.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean(); // Use lean for better performance

    logger.info(`Successfully retrieved ${results.length} match results`);

    return results;
  } catch (error) {
    const errorMessage = error.message || "Unknown error";
    const errorDetails = {
      message: errorMessage,
      stack: error.stack,
    };

    logger.error(`Error retrieving all match results:`, errorDetails);
    throw new Error(errorDetails.message);
  }
};

const getSpecificDPFMatchResult = async (matchId) => {
  try {
    logger.info(`Attempting to retrieve match result for matchId: ${matchId}`);
    // Double-check MatchResult model
    if (!MatchResult) {
      logger.error("MatchResult model is undefined in getSpecificMatchResult", {
        models: {
          Tournament: !!Tournament,
          Player: !!Player,
          MatchResult: !!MatchResult,
        },
      });
      throw new Error("MatchResult model is not available");
    }

    // Validate inputs
    if (!matchId || isNaN(parseInt(matchId))) {
      throw new Error("matchId must be a valid number");
    }

    // Retrieve match result
    const result = await MatchResult.findOne({ matchId }).lean();

    if (!result) {
      throw new Error(`No match result found for matchId: ${matchId}`);
    }

    logger.info(`Successfully retrieved match result for matchId: ${matchId}`);

    return result;
  } catch (error) {
    const errorMessage = error.message || "Unknown error";
    const errorDetails = {
      message: errorMessage,
      stack: error.stack,
      input: { matchId },
    };

    logger.error(`Error retrieving match result for matchId: ${matchId}:`, {
      ...errorDetails,
    });
    throw new Error(errorDetails.message);
  }
};

/**
 * Get participated events for a player
 * @param {string} playerId - The RankedIn player ID
 * @param {string} language - The language code (en/da)
 * @returns {Promise<Object>} - Events the player participates in
 */
const getParticipatedEvents = async (playerId, language = "en") => {
  if (!playerId) {
    logger.warn("Skipping getParticipatedEvents: playerId is undefined");
    return null;
  }

  try {
    logger.info(`Getting participated events for player: ${playerId}`);
    const response = await axios.get(
      `${API_BASE_URL}player/GetPlayerTournamentsAsync`,
      {
        params: {
          playerid: playerId, // Changed from playerId to playerid
          language,
          _: Date.now(),
        },
      }
    );

    if (response.data && response.data.Payload) {
      logger.info(
        `Found ${response.data.Payload.length} events for player ${playerId}`
      );
      return response.data;
    } else {
      logger.warn(`No events found for player ${playerId}`);
      return { Payload: [] };
    }
  } catch (error) {
    const errorDetails = {
      message: `Error fetching participated events for player ${playerId}`,
      error: error.message,
      stack: error.stack,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      requestURL: `${API_BASE_URL}player/GetPlayerTournamentsAsync?playerid=${playerId}&language=${language}`,
    };
    logger.error(errorDetails.message, {
      ...errorDetails,
    });
    return { Payload: [] };
  }
};

/**
 * Get all matches for a specific event
 * @param {string} eventId - The event ID
 * @param {string} language - The language code (en/da)
 * @returns {Promise<Object>} - Matches for the event
 */
const getEventMatches = async (eventId, language = "en") => {
  if (!eventId) {
    logger.warn("Skipping getEventMatches: eventId is undefined");
    return null;
  }

  try {
    logger.info(`Getting matches for event: ${eventId}`);
    const response = await axios.get(
      `${API_BASE_URL}tournament/GetMatchesForEventAsync`,
      {
        params: {
          eventid: eventId, // Changed from eventId to eventid
          language,
          _: Date.now(),
        },
      }
    );

    if (response.data && response.data.Matches) {
      logger.info(
        `Found ${response.data.Matches.length} matches for event ${eventId}`
      );
      return response.data;
    } else {
      logger.warn(`No matches found for event ${eventId}`);
      return { Matches: [] };
    }
  } catch (error) {
    const errorDetails = {
      message: `Error fetching matches for event ${eventId}`,
      error: error.message,
      stack: error.stack,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      requestURL: `${API_BASE_URL}tournament/GetMatchesForEventAsync?eventid=${eventId}&language=${language}`,
    };
    logger.error(errorDetails.message, {
      ...errorDetails,
    });
    return { Matches: [] };
  }
};

/**
 * Get upcoming and recent matches for a player
 * @param {string} playerId - The RankedIn player ID
 * @param {boolean} takeHistory - Whether to include historical matches
 * @param {number} skip - Number of matches to skip
 * @param {number} take - Number of matches to take
 * @param {string} language - The language code (en/da)
 * @returns {Promise<Object>} - Player's matches
 */
const getPlayerMatches = async (
  playerId,
  takeHistory = false,
  skip = 0,
  take = 10,
  language = "en"
) => {
  if (!playerId) {
    logger.warn("Skipping getPlayerMatches: playerId is undefined");
    return null;
  }

  try {
    logger.info(
      `Getting matches for player: ${playerId}, includeHistory: ${takeHistory}`
    );
    const response = await axios.get(
      `${API_BASE_URL}player/GetPlayerMatchesAsync`,
      {
        params: {
          playerid: playerId,
          takehistory: takeHistory,
          skip,
          take,
          language,
          _: Date.now(),
        },
      }
    );

    if (response.data && response.data.Matches) {
      logger.info(
        `Found ${response.data.Matches.length} matches for player ${playerId}`
      );
      return response.data;
    } else {
      logger.warn(`No matches found for player ${playerId}`);
      return { Matches: [] };
    }
  } catch (error) {
    const errorDetails = {
      message: `Error fetching matches for player ${playerId}`,
      error: error.message,
      stack: error.stack,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      requestURL: `${API_BASE_URL}player/GetPlayerMatchesAsync?playerid=${playerId}&takehistory=${takeHistory}&skip=${skip}&take=${take}&language=${language}`,
    };
    logger.error(errorDetails.message, {
      ...errorDetails,
    });
    return { Matches: [] };
  }
};

module.exports = {
  getAvailableTournaments,
  getAllMatches,
  getUpcomingTournament,
  getAllTournamentPlayers,
  getAllRows,
  getPlayersInRow,
  getPlayersMatches,
  getPlayerDetails,
  getNextMatchAndUpcommingOnCourt,
  saveMatchResult,
  getAllDPFMatchResults,
  getSpecificDPFMatchResult,
  API_BASE_URL,
  OrganisationIdSmashHorsens,
  OrganisationIdSmashStensballe,
  searchPlayer,
  getParticipatedEvents, // Added new method
  getEventMatches, // Added new method
  getPlayerMatches, // Added new method for upcoming player matches
};
