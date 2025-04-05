const express = require("express");
const checkInService = require("../Services/checkInService");
const { sendNotification } = require("../Services/subscriptionService");

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
  try {
    const { tournamentId, rowId } = req.query;
    const checkInStatus = await checkInService.getCheckInStatus(
      tournamentId,
      rowId
    );
    res.status(200).json(checkInStatus);
  } catch (err) {
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
 *     responses:
 *       200:
 *         description: Check-in status updated successfully
 *       500:
 *         description: Server error
 */
router.post("/check-in/update", async (req, res) => {
  try {
    const { tournamentId, rowId, playerId, playerName, checkedIn, userId } =
      req.body;
    // Update the check-in status
    await checkInService.updateCheckInStatus(
      tournamentId,
      rowId,
      playerId,
      playerName,
      checkedIn
    );

    await sendNotification(
      userId,
      "Check-in Successful",
      "You’ve checked in!",
      null
    );

    res.status(200).json({ message: "Check-in status updated successfully" });
  } catch (err) {
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
 *     responses:
 *       200:
 *         description: Check-in status updated successfully for all players
 *       500:
 *         description: Server error
 */
router.post("/check-in/bulk-update", async (req, res) => {
  try {
    const { tournamentId, rowId, checkedIn, players } = req.body;
    await checkInService.bulkUpdateCheckInStatus(
      tournamentId,
      rowId,
      checkedIn,
      players
    );
    res.status(200).json({
      message: "Check-in status updated successfully for all players",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
