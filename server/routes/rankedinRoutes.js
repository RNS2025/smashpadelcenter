const express = require("express");
const rankedInService = require("../Services/rankedInService");
const { verifyJWT, checkRole } = require("../middleware/jwt");
const logger = require("../config/logger");
const router = express.Router();
const axios = require("axios");

/**
 * @swagger
 * /api/v1/GetAllTournamentPlayers:
 *   get:
 *     summary: Get all tournament players
 *     tags: [RankedIn]
 *     parameters:
 *       - in: query
 *         name: tournamentid
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the tournament
 *       - in: query
 *         name: language
 *         required: false
 *         schema:
 *           type: string
 *         description: The language for the response (default is "en")
 *     responses:
 *       200:
 *         description: All tournament players
 */
router.get("/GetAllTournamentPlayers", async (req, res) => {
  try {
    const { tournamentid, language } = req.query;
    const players = await rankedInService.getAllTournamentPlayers(
      tournamentid,
      language
    );
    logger.info("Successfully fetched all tournament players", {
      tournamentid,
    });
    res.status(200).json(players);
  } catch (err) {
    logger.error("Error fetching tournament players", {
      tournamentid: req.query.tournamentid,
      error: err.message,
    });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/GetAllRows:
 *   get:
 *     summary: Get all rows
 *     tags: [RankedIn]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the tournament
 *     responses:
 *       200:
 *         description: All rows
 */
router.get("/GetAllRows", async (req, res) => {
  try {
    const { id } = req.query;
    const rows = await rankedInService.getAllRows(id);
    logger.info("Successfully fetched all rows", { tournamentId: id });
    res.status(200).json(rows);
  } catch (err) {
    logger.error("Error fetching rows", {
      tournamentId: req.query.id,
      error: err.message,
    });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/GetPlayersInRow:
 *   get:
 *     summary: Get all players in a specific row
 *     tags: [RankedIn]
 *     parameters:
 *       - in: query
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the tournament
 *       - in: query
 *         name: tournamentClassId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the tournament class
 *       - in: query
 *         name: language
 *         required: false
 *         schema:
 *           type: string
 *         description: The language for the response (default is "en")
 *     responses:
 *       200:
 *         description: All players in the specified row
 */
router.get("/GetPlayersInRow", async (req, res) => {
  try {
    const { tournamentId, tournamentClassId, language } = req.query;
    const players = await rankedInService.getPlayersInRow(
      tournamentId,
      tournamentClassId,
      language
    );
    logger.info("Successfully fetched players in row", {
      tournamentId,
      tournamentClassId,
    });
    res.status(200).json(players);
  } catch (err) {
    logger.error("Error fetching players in row", {
      tournamentId: req.query.tournamentId,
      tournamentClassId: req.query.tournamentClassId,
      error: err.message,
    });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/GetUpcomingTournament:
 *   get:
 *     summary: Get all upcoming tournaments
 *     tags: [RankedIn]
 *     responses:
 *       200:
 *         description: List of upcoming tournaments
 *       500:
 *         description: Server error
 */
router.get("/GetUpcomingTournament", async (req, res) => {
  try {
    const tournaments = await rankedInService.getUpcomingTournament();
    logger.info("Successfully fetched upcoming tournaments");
    res.status(200).json(tournaments);
  } catch (err) {
    logger.error("Error fetching upcoming tournaments", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/GetAvailableTournaments:
 *   get:
 *     summary: Get all available tournaments
 *     tags: [RankedIn]
 *     parameters:
 *       - in: query
 *         name: organisationId
 *         required: false
 *         schema:
 *           type: string
 *         description: The ID of the organisation
 *       - in: query
 *         name: isFinished
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Whether the tournaments are finished (default is false)
 *       - in: query
 *         name: language
 *         required: false
 *         schema:
 *           type: string
 *         description: The language for the response (default is "en")
 *       - in: query
 *         name: skip
 *         required: false
 *         schema:
 *           type: integer
 *         description: The number of records to skip (default is 0)
 *       - in: query
 *         name: take
 *         required: false
 *         schema:
 *           type: integer
 *         description: The number of records to take (default is 10)
 *     responses:
 *       200:
 *         description: All available tournaments
 *       500:
 *         description: Server error
 */
router.get("/GetAvailableTournaments", async (req, res) => {
  try {
    const { organisationId, isFinished, language, skip, take } = req.query;
    const tournaments = await rankedInService.getAvailableTournaments(
      organisationId,
      isFinished,
      language,
      skip,
      take
    );
    logger.info("Successfully fetched available tournaments", {
      organisationId,
      isFinished,
    });
    res.status(200).json(tournaments);
  } catch (err) {
    logger.error("Error fetching available tournaments", {
      organisationId: req.query.organisationId,
      error: err.message,
    });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/GetPlayersMatches:
 *   get:
 *     summary: Get all matches for a specific player
 *     tags: [RankedIn]
 *     parameters:
 *       - in: query
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the player
 *       - in: query
 *         name: rowId
 *         required: false
 *         schema:
 *           type: string
 *         description: The ID of the tournament
 *     responses:
 *       200:
 *         description: All matches for the player
 */
router.get("/GetPlayersMatches", async (req, res) => {
  try {
    const { playerId, rowId } = req.query;
    const matches = await rankedInService.getPlayersMatches(playerId, rowId);
    logger.info("Successfully fetched player matches", { playerId, rowId });
    res.status(200).json(matches);
  } catch (err) {
    logger.error("Error fetching player matches", {
      playerId: req.query.playerId,
      rowId: req.query.rowId,
      error: err.message,
    });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/GetPlayerDetails:
 *   get:
 *     summary: Get details of a specific player
 *     tags: [RankedIn]
 *     parameters:
 *       - in: query
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the player
 *       - in: query
 *         name: language
 *         required: false
 *         schema:
 *           type: string
 *         description: The language for the response (default is "en")
 *     responses:
 *       200:
 *         description: Details of the specified player
 *       500:
 *         description: Server error
 */
router.get("/GetPlayerDetails", async (req, res) => {
  try {
    const { rankedInId, language } = req.query;
    const playerDetails = await rankedInService.getPlayerDetails(
      rankedInId,
      language
    );
    logger.info("Successfully fetched player details", { rankedInId });
    res.status(200).json(playerDetails);
  } catch (err) {
    logger.error("Error fetching player details", {
      playerId: req.query.playerId,
      error: err.message,
    });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/GetAllMatches:
 *   get:
 *     summary: Get all matches for a tournament
 *     tags: [RankedIn]
 *     parameters:
 *       - in: query
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the tournament
 *     responses:
 *       200:
 *         description: All matches for the tournament
 *       500:
 *         description: Server error
 */
router.get("/GetAllMatches", async (req, res) => {
  try {
    const { tournamentId } = req.query;
    const matches = await rankedInService.getAllMatches(tournamentId);
    logger.info("Successfully fetched all matches", { tournamentId });
    res.status(200).json(matches);
  } catch (err) {
    logger.error("Error fetching all matches", {
      tournamentId: req.query.tournamentId,
      error: err.message,
    });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/GetOnGoingMatchAndUpcommingMatch:
 *   get:
 *     summary: Get current and next match for a court
 *     tags: [RankedIn]
 *     parameters:
 *       - in: query
 *         name: courtName
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the court
 *       - in: query
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the tournament
 *     responses:
 *       200:
 *         description: Ongoing and upcoming matches
 *       500:
 *         description: Server error
 */
router.get("/GetOnGoingMatchAndUpcommingMatch", async (req, res) => {
  try {
    const { courtName, tournamentId } = req.query;
    const matches = await rankedInService.getNextMatchAndUpcommingOnCourt(
      tournamentId,
      courtName
    );
    logger.info("Successfully fetched ongoing and upcoming matches", {
      tournamentId,
      courtName,
    });
    res.status(200).json(matches);
  } catch (err) {
    logger.error("Error fetching ongoing and upcoming matches", {
      tournamentId: req.query.tournamentId,
      courtName: req.query.courtName,
      error: err.message,
    });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/search-player:
 *   get:
 *     summary: Search for players
 *     tags: [RankedIn]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         required: true
 *         schema:
 *           type: string
 *         description: The search term for the player
 *       - in: query
 *         name: rankingId
 *         required: false
 *         schema:
 *           type: string
 *         description: The ID of the ranking
 *       - in: query
 *         name: rankingType
 *         required: false
 *         schema:
 *           type: string
 *         description: The type of ranking
 *       - in: query
 *         name: ageGroup
 *         required: false
 *         schema:
 *           type: string
 *         description: The age group
 *       - in: query
 *         name: rankingDate
 *         required: false
 *         schema:
 *           type: string
 *         description: The ranking date
 *     responses:
 *       200:
 *         description: List of matching players
 *       500:
 *         description: Server error
 */
router.get("/search-player", async (req, res) => {
  const { searchTerm, rankingId, rankingType, ageGroup, rankingDate } =
    req.query;

  try {
    const players = await rankedInService.searchPlayer(
      searchTerm,
      rankingId,
      rankingType,
      ageGroup,
      rankingDate
    );
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/SaveMatchResult:
 *   post:
 *     summary: Save a match result
 *     tags: [RankedIn]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matchId
 *               - sets
 *             properties:
 *               matchId:
 *                 type: number
 *                 description: The ID of the match
 *               sets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     player1:
 *                       type: string
 *                       description: Score for player/team 1
 *                     player2:
 *                       type: string
 *                       description: Score for player/team 2
 *               tiebreak:
 *                 type: object
 *                 properties:
 *                   player1:
 *                     type: string
 *                     description: Tiebreak score for player/team 1
 *                   player2:
 *                     type: string
 *                     description: Tiebreak score for player/team 2
 *     responses:
 *       200:
 *         description: Match result saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Match result saved successfully
 *                 matchId:
 *                   type: number
 *                   example: 12345
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post("/SaveMatchResult", async (req, res) => {
  try {
    // Log the raw request body to debug content
    logger.info("SaveMatchResult request received", {
      body: req.body,
      contentType: req.headers["content-type"],
    });

    const { matchId, sets, tiebreak, tournamentName, row, players } = req.body;

    // Enhanced validation with specific feedback
    if (!matchId) {
      return res.status(400).json({ error: "matchId is required" });
    }
    if (!tournamentName) {
      return res.status(400).json({ error: "tournamentName is required" });
    }

    if (!sets) {
      return res.status(400).json({ error: "sets are required" });
    }

    if (!Array.isArray(sets)) {
      return res.status(400).json({ error: "sets must be an array" });
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: "at least one set is required" });
    }

    // Validate each set has the correct structure
    for (let i = 0; i < sets.length; i++) {
      if (!sets[i] || typeof sets[i] !== "object") {
        return res
          .status(400)
          .json({ error: `Set ${i + 1} has invalid format` });
      }

      if (!sets[i].player1 || !sets[i].player2) {
        return res
          .status(400)
          .json({ error: `Set ${i + 1} must have player1 and player2 scores` });
      }
    }

    // Try to save the match result
    const result = await rankedInService.saveMatchResult({
      matchId,
      sets,
      tiebreak,
      tournamentName,
      row,
      players,
    });

    logger.info("Successfully saved match result", { matchId, result });

    res.status(200).json({
      message: "Match result saved successfully",
      matchId,
      result,
    });
  } catch (err) {
    // Extract more details from the error
    const errorMessage = err.message || "Unknown error";
    const statusCode = errorMessage.includes("already exists") ? 409 : 500;

    logger.error("Error saving match result", {
      matchId: req.body?.matchId,
      error: errorMessage,
      stack: err.stack,
    });

    res.status(statusCode).json({
      error: errorMessage,
      success: false,
    });
  }
});

/**
 * @swagger
 * /api/v1/GetAllDPFMatchResults:
 *   get:
 *     summary: Get all saved DPF match results
 *     tags: [RankedIn]
 *     responses:
 *       200:
 *         description: List of all match results
 *       500:
 *         description: Server error
 */
router.get("/GetAllDPFMatchResults", async (req, res) => {
  try {
    const results = await rankedInService.getAllDPFMatchResults();
    res.status(200).json(results);
  } catch (error) {
    logger.error("Error fetching all DPF match results:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch match results" });
  }
});

router.get("/GetSpecificDPFMatchResult", verifyJWT, async (req, res) => {
  try {
    const matchId = req.query.matchId;
    const result = await rankedInService.getSpecificDPFMatchResult(matchId);
    res.status(200).json(result);
  } catch (error) {
    logger.error("Error fetching specific DPF match result:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch match result" });
  }
});

router.get("/GetSpecificDPFMatchResult", verifyJWT, async (req, res) => {
  try {
    const matchId = req.query.matchId;
    const result = await rankedInService.getSpecificDPFMatchResult(matchId);
    console.log("Result:", result);
    res.status(200).json(result);
  } catch (error) {
    logger.error("Error fetching specific DPF match result:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch match result" });
  }
});

/**
 * @swagger
 * /api/v1/SearchParticipants:
 *   get:
 *     summary: Search for participants by name (RankedIn)
 *     tags: [RankedIn]
 *     parameters:
 *       - in: query
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *         description: The search term (player name)
 *       - in: query
 *         name: language
 *         required: false
 *         schema:
 *           type: string
 *         description: The language for the response (default is "en")
 *       - in: query
 *         name: take
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of results to return (default 5)
 *       - in: query
 *         name: skip
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of results to skip (default 0)
 *     responses:
 *       200:
 *         description: List of matching participants
 */
router.get("/SearchParticipants", async (req, res) => {
  // Log the incoming request for debugging
  logger.info("SearchParticipants request received", {
    query: req.query,
    contentType: req.headers["content-type"],
  });

  console.log("SearchParticipants params:", {
    term: req.query.term,
    language: req.query.language,
    take: req.query.take,
    skip: req.query.skip,
  });
  try {
    const { term, language = "en", take = 5, skip = 0 } = req.query;
    if (!term) {
      return res.status(400).json({ error: "Search term is required" });
    }
    console.log("Searching participants with term:", term);
    const response = await axios.get(
      "https://api.rankedin.com/v1/search/GetParticipantsAsync",
      {
        params: { term, language, take, skip },
      }
    );
    // Always treat response.data as the result, since the API returns an array directly
    let participants = [];
    if (Array.isArray(response.data)) {
      participants = response.data;
    } else if (response.data && Array.isArray(response.data.Payload)) {
      participants = response.data.Payload;
    } else if (response.data && typeof response.data === "object") {
      // If the API ever wraps the array in a property, try to find the first array property
      const arrProp = Object.values(response.data).find((v) =>
        Array.isArray(v)
      );
      if (arrProp) participants = arrProp;
    }
    res.status(200).json(participants);
  } catch (err) {
    logger.error("Error searching RankedIn participants", {
      error: err.message,
    });
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
