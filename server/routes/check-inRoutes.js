const express = require("express");
const checkInService = require("../Services/checkInService");
const databaseService = require("../Services/databaseService");
const logger = require("../config/logger");
const NotificationHelper = require("../utils/notificationHelper");

const router = express.Router();

/**
 * @swagger
 * /api/v1/check-in/status:
 *   get:
 *     summary: Get check-in status for players in a specific tournament and row
 *     tags: [CheckIn]
 *     parameters:
 *       - in: query
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the tournament
 *       - in: query
 *         name: rowId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the row
 *     responses:
 *       200:
 *         description: Check-in status for players
 *       500:
 *         description: Server error
 */
router.get("/check-in/status", async (req, res) => {
  logger.debug("Fetching check-in status", {
    tournamentId: req.query.tournamentId,
    rowId: req.query.rowId,
  });
  try {
    const { tournamentId, rowId } = req.query;
    const checkInStatus = await checkInService.getCheckInStatus(
      tournamentId,
      rowId
    );
    logger.info("Check-in status fetched successfully", {
      tournamentId,
      rowId,
      playersCount: checkInStatus.length,
    });
    res.status(200).json(checkInStatus);
  } catch (err) {
    logger.error("Error fetching check-in status", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/check-in/update:
 *   post:
 *     summary: Update check-in status for a player
 *     tags: [CheckIn]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tournamentId:
 *                 type: string
 *               rowId:
 *                 type: string
 *               playerId:
 *                 type: string
 *               playerName:
 *                 type: string
 *               checkedIn:
 *                 type: boolean
 *               userId:
 *                 type: string
 *               partnerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               adminIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Check-in status updated successfully
 *       500:
 *         description: Server error
 */
router.post("/check-in/update", async (req, res) => {
  logger.debug("Updating check-in status", {
    tournamentId: req.body.tournamentId,
    playerId: req.body.playerId,
    checkedIn: req.body.checkedIn,
  });
  try {
    const {
      tournamentId,
      rowId,
      playerId,
      playerName,
      checkedIn,
      userId,
      partnerIds = [],
    } = req.body;

    // Get admin usernames for notifications
    const adminUsernames = await databaseService.getAdminUsernames();

    // Update the check-in status
    await checkInService.updateCheckInStatus(
      tournamentId,
      rowId,
      playerId,
      playerName,
      checkedIn
    );

    // Notify the partner pair (PLAYER_CHECKED_IN)
    NotificationHelper.notifyMultiple(
      partnerIds,
      "Din makker er tjekket ind!",
      `${playerName} er nu tjekket ind til turneringen. Husk at tjekke ind, hvis du ikke allerede har gjort det!`,
      "info",
      `/turneringer/check-in?tournamentId=${tournamentId}&rowId=${rowId}`
    );

    // Notify all admins (PARTNER_CHECKED_IN)
    NotificationHelper.notifyMultiple(
      adminUsernames,
      "Spiller tjekket ind",
      `${playerName} er tjekket ind til turneringen (række: ${rowId}).`,
      "info",
      `/turneringer/check-in?tournamentId=${tournamentId}&rowId=${rowId}`
    );

    logger.info("Check-in status updated successfully", {
      tournamentId,
      rowId,
      playerId,
      playerName,
      checkedIn,
    });
    res.status(200).json({ message: "Check-in status updated successfully" });
  } catch (err) {
    logger.error("Error updating check-in status", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/check-in/bulk-update:
 *   post:
 *     summary: Bulk update check-in status for multiple players
 *     tags: [CheckIn]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tournamentId:
 *                 type: string
 *               rowId:
 *                 type: string
 *               checkedIn:
 *                 type: boolean
 *               players:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     playerId:
 *                       type: string
 *                     playerName:
 *                       type: string
 *                     partnerIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                     adminIds:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Check-in status updated successfully for all players
 *       500:
 *         description: Server error
 */
router.post("/check-in/bulk-update", async (req, res) => {
  logger.debug("Bulk updating check-in status", {
    tournamentId: req.body.tournamentId,
    rowId: req.body.rowId,
    checkedIn: req.body.checkedIn,
    playerCount: req.body.players.length,
  });
  try {
    const { tournamentId, rowId, checkedIn, players } = req.body;

    // Get admin usernames for notifications
    const adminUsernames = await databaseService.getAdminUsernames();

    await checkInService.bulkUpdateCheckInStatus(
      tournamentId,
      rowId,
      checkedIn,
      players
    );

    // Notify each player's partner pair and admins
    for (const player of players) {
      const { playerId, playerName, partnerIds = [] } = player;

      // Notify the partner pair (PLAYER_CHECKED_IN)
      NotificationHelper.notifyMultiple(
        partnerIds,
        "Din makker er tjekket ind!",
        `${playerName} er nu tjekket ind til turneringen. Husk at tjekke ind, hvis du ikke allerede har gjort det!`,
        "info",
        `/turneringer/check-in?tournamentId=${tournamentId}&rowId=${rowId}`
      );

      // Notify all admins (PARTNER_CHECKED_IN)
      NotificationHelper.notifyMultiple(
        adminUsernames,
        "Spiller tjekket ind",
        `${playerName} er tjekket ind til turneringen (række: ${rowId}).`,
        "info",
        `/turneringer/check-in?tournamentId=${tournamentId}&rowId=${rowId}`
      );
    }

    logger.info("Bulk check-in status updated successfully", {
      tournamentId,
      rowId,
      checkedIn,
      playerCount: players.length,
    });
    res.status(200).json({
      message: "Check-in status updated successfully for all players",
    });
  } catch (err) {
    logger.error("Error bulk updating check-in status", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
