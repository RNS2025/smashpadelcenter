const axios = require("axios");
const { Tournament, Player } = require("../models/rankedInModels");
const API_BASE_URL = "https://api.rankedin.com/v1/";
const OrganisationIdSmashHorsens = "4310";
const OrganisationIdSmashStensballe = "9492";

// Debug: Verify model import
console.log(
  "Tournament model:",
  typeof Tournament,
  "Player model:",
  typeof Player
);

const getAvailableTournaments = async (
  organisationId = "4310",
  isFinished = false,
  language = "en",
  skip = 0,
  take = 10
) => {
  // Check MongoDB first
  console.log(
    `Checking MongoDB for tournaments: org ${organisationId}, isFinished ${isFinished}`
  );
  const tournaments = await Tournament.find({
    organisationId,
    isFinished,
  }).lean();
  if (tournaments.length > 0) {
    console.log(`Using DB tournaments for org ${organisationId}`);
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

  // Fetch from API
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
    console.log(`API response for org ${organisationId}:`, {
      payloadLength: data.payload?.length || 0,
    });

    // Handle empty or invalid response
    if (!data.payload || data.payload.length === 0) {
      console.log(`No tournaments returned from API for org ${organisationId}`);
      return { payload: [] };
    }

    // Save to MongoDB
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

    console.log(
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
    console.error(
      `Error fetching tournaments for org ${organisationId}:`,
      error.message
    );
    return { payload: [] };
  }
};

const getUpcomingTournament = async (
  organisationId = "4310",
  language = "en"
) => {
  try {
    console.debug("Fetching upcoming tournament with params:", {
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
    console.error("Error fetching upcoming tournament:", error.message);
    return { payload: [] };
  }
};

const getAllTournamentPlayers = async (tournamentId, language = "en") => {
  // Validate tournamentId
  if (!tournamentId) {
    console.warn("Skipping getAllTournamentPlayers: tournamentId is undefined");
    return [];
  }

  // Check MongoDB first
  const players = await Player.find({ tournamentId }).lean();
  if (players.length > 0) {
    console.log(`Using DB players for tournament ${tournamentId}`);
    return players.map((p) => ({
      id: p.rankedInId,
      firstName: p.name.split(" ")[0] || "",
      lastName: p.name.split(" ").slice(1).join(" ") || "",
      rankedInId: p.rankedInId,
      // Add other Player fields as needed
    }));
  }

  // Fetch from API
  try {
    console.log(`Fetching players for tournamentId ${tournamentId}`);
    const response = await axios.get(
      `${API_BASE_URL}tournament/GetAllSeedsAsync`,
      {
        params: { tournamentid: tournamentId, language },
      }
    );
    const playersData = response.data;

    // Save to MongoDB
    await Player.deleteMany({ tournamentId });
    const playerDocs = playersData.map((player) => ({
      tournamentId,
      rankedInId: player.RankedinId,
      name: player.Name,
      updatedAt: new Date(),
    }));
    await Player.insertMany(playerDocs);

    console.log(
      `Saved ${playerDocs.length} players for tournament ${tournamentId}`
    );
    return playerDocs.map((p) => ({
      id: p.rankedInId,
      firstName: p.name.split(" ")[0] || "",
      lastName: p.name.split(" ").slice(1).join(" ") || "",
      rankedInId: p.rankedInId,
    }));
  } catch (error) {
    console.error(
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
    console.warn("Skipping getAllRows: tournamentId is undefined");
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
    return rows; // Adjust based on Row interface if needed
  } catch (error) {
    console.error(
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
    console.warn(
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
      // Add other Player fields as needed
    }));
  } catch (error) {
    console.error(
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
    console.warn(
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
              date: match.Date || null,
              courtName: match.CourtName || null,
              durationMinutes:
                match.MatchViewModel?.TotalDurationInMinutes || null,
              challenger: {
                id: match.ChallengerParticipant?.RankedinId || "",
                firstPlayer: {
                  id: match.ChallengerParticipant?.FirstPlayer?.RankedinId,
                  firstName:
                    match.ChallengerParticipant?.FirstPlayer?.Name.split(
                      " "
                    )[0] || "",
                  lastName:
                    match.ChallengerParticipant?.FirstPlayer?.Name.split(" ")
                      .slice(1)
                      .join(" ") || "",
                  rankedInId:
                    match.ChallengerParticipant?.FirstPlayer?.RankedinId,
                },
                secondPlayer: match.ChallengerParticipant?.SecondPlayer
                  ? {
                      id: match.ChallengerParticipant?.SecondPlayer?.RankedinId,
                      firstName:
                        match.ChallengerParticipant?.SecondPlayer?.Name.split(
                          " "
                        )[0] || "",
                      lastName:
                        match.ChallengerParticipant?.SecondPlayer?.Name.split(
                          " "
                        )
                          .slice(1)
                          .join(" ") || "",
                      rankedInId:
                        match.ChallengerParticipant?.SecondPlayer?.RankedinId,
                    }
                  : null,
              },
              challenged: {
                id: match.ChallengedParticipant?.RankedinId || "",
                firstPlayer: {
                  id: match.ChallengedParticipant?.FirstPlayer?.RankedinId,
                  firstName:
                    match.ChallengedParticipant?.FirstPlayer?.Name.split(
                      " "
                    )[0] || "",
                  lastName:
                    match.ChallengedParticipant?.FirstPlayer?.Name.split(" ")
                      .slice(1)
                      .join(" ") || "",
                  rankedInId:
                    match.ChallengedParticipant?.FirstPlayer?.RankedinId,
                },
                secondPlayer: match.ChallengedParticipant?.SecondPlayer
                  ? {
                      id: match.ChallengedParticipant?.SecondPlayer?.RankedinId,
                      firstName:
                        match.ChallengedParticipant?.SecondPlayer?.Name.split(
                          " "
                        )[0] || "",
                      lastName:
                        match.ChallengedParticipant?.SecondPlayer?.Name.split(
                          " "
                        )
                          .slice(1)
                          .join(" ") || "",
                      rankedInId:
                        match.ChallengedParticipant?.SecondPlayer?.RankedinId,
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
                          id: challenger?.players[0]?.RankedinId,
                          firstName:
                            challenger?.players[0]?.Name.split(" ")[0] || "",
                          lastName:
                            challenger?.players[0]?.Name.split(" ")
                              .slice(1)
                              .join(" ") || "",
                          rankedInId: challenger?.players[0]?.RankedinId,
                        },
                        secondPlayer: challenger?.players[1]
                          ? {
                              id: challenger?.players[1]?.RankedinId,
                              firstName:
                                challenger?.players[1]?.Name.split(" ")[0] ||
                                "",
                              lastName:
                                challenger?.players[1]?.Name.split(" ")
                                  .slice(1)
                                  .join(" ") || "",
                              rankedInId: challenger?.players[1]?.RankedinId,
                            }
                          : null,
                      },
                      challenged: {
                        id: challenged?.players[0]?.RankedinId || "",
                        firstPlayer: {
                          id: challenged?.players[0]?.RankedinId,
                          firstName:
                            challenged?.players[0]?.Name.split(" ")[0] || "",
                          lastName:
                            challenged?.players[0]?.Name.split(" ")
                              .slice(1)
                              .join(" ") || "",
                          rankedInId: challenged?.players[0]?.RankedinId,
                        },
                        secondPlayer: challenged?.players[1]
                          ? {
                              id: challenged?.players[1]?.RankedinId,
                              firstName:
                                challenged?.players[1]?.Name.split(" ")[0] ||
                                "",
                              lastName:
                                challenged?.players[1]?.Name.split(" ")
                                  .slice(1)
                                  .join(" ") || "",
                              rankedInId: challenged?.players[1]?.RankedinId,
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
          console.warn(`Unsupported BaseType: ${tournamentData.BaseType}`);
          break;
      }
    });

    playerMatches.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date) - new Date(b.date);
    });

    return playerMatches;
  } catch (error) {
    console.error(
      `Error fetching matches for playerId ${playerId}:`,
      error.message
    );
    return [];
  }
};

const getPlayerDetails = async (playerId, language = "en") => {
  if (!playerId) {
    console.warn("Skipping getPlayerDetails: playerId is undefined");
    return null;
  }
  try {
    const response = await axios.get(
      `${API_BASE_URL}player/playerprofileinfoasync`,
      {
        params: { rankedInId: playerId, language },
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
    console.error(
      `Error fetching player details for playerId ${playerId}:`,
      error.message
    );
    return null;
  }
};

const getAllMatches = async (tournamentId, language = "en") => {
  if (!tournamentId) {
    console.warn("Skipping getAllMatches: tournamentId is undefined");
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
    console.error(
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
  if (!tournamentId || !courtName) {
    console.warn(
      "Skipping getNextMatchOnCourt: invalid tournamentId or courtName"
    );
    return { ongoingMatch: null, upcomingMatch: null };
  }
  try {
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
      console.log(`No matches found for tournamentId ${tournamentId}`);
      return { ongoingMatch: null, upcomingMatch: null };
    }
    const now = new Date();
    const courtNameLower = courtName.toLowerCase();
    // Filter matches for the specified court (case insensitive)
    const courtMatches = matches.filter(
      (match) => match.Court && match.Court.toLowerCase() === courtNameLower
    );
    // Since we don't have EndTime, we'll estimate each match takes 1 hour
    const MATCH_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds
    // Find ongoing match
    const ongoingMatch = courtMatches.find((match) => {
      if (!match.Date) return false;
      const startTime = new Date(match.Date);
      const endTime = new Date(startTime.getTime() + MATCH_DURATION_MS);
      return startTime <= now && endTime >= now;
    });
    // Find upcoming match
    const upcomingMatch = courtMatches
      .filter((match) => match.Date && new Date(match.Date) > now)
      .sort((a, b) => new Date(a.Date) - new Date(b.Date))[0];
    return { ongoingMatch, upcomingMatch };
  } catch (error) {
    console.error(
      `Error fetching next match on court for tournamentId ${tournamentId}:`,
      error.message
    );
    return { ongoingMatch: null, upcomingMatch: null };
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
  API_BASE_URL,
  OrganisationIdSmashHorsens,
  OrganisationIdSmashStensballe,
};
