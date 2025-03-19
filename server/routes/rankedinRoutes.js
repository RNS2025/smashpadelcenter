const express = require("express");
const rankedInService = require("../Services/rankedInService");

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
    res.status(200).json(players);
  } catch (err) {
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
    res.status(200).json(rows);
  } catch (err) {
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
    res.status(200).json(players);
  } catch (err) {
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
    res.status(200).json(tournaments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
