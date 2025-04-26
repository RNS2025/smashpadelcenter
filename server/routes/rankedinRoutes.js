const express = require("express");
const rankedInService = require("../Services/rankedInService");
const logger = require("../config/logger"); // Import logger
const router = express.Router();

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
    const { playerId, language } = req.query;
    const playerDetails = await rankedInService.getPlayerDetails(
      playerId,
      language
    );
    logger.info("Successfully fetched player details", { playerId });
    res.status(200).json(playerDetails);
  } catch (err) {
    logger.error("Error fetching player details", {
      playerId: req.query.playerId,
      error: err.message,
    });
    res.status(500).json({ error: err.message });
  }
});

// Get all matches for a turnmament
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

// Get Current Match and Next Match for a Courtname
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

module.exports = router;
