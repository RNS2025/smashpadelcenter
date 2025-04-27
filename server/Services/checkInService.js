const CheckIn = require("../models/CheckIn");
const logger = require("../config/logger");

/**
 * Get check-in status for players in a specific tournament and row
 * @param {string} tournamentId - The tournament ID
 * @param {string} rowId - The row ID
 * @returns {Promise<Array>} - Array of check-in status objects
 */
const getCheckInStatus = async (tournamentId, rowId) => {
  try {
    const checkInRecords = await CheckIn.find({ tournamentId, rowId }).lean();
    logger.debug("CheckInService: Retrieved check-in status", {
      tournamentId,
      rowId,
      count: checkInRecords.length,
    });
    return checkInRecords;
  } catch (error) {
    logger.error("CheckInService: Error fetching check-in status:", {
      error: error.message,
      tournamentId,
      rowId,
    });
    throw new Error("Failed to fetch check-in status");
  }
};

/**
 * Update check-in status for a player
 * @param {string} tournamentId - The tournament ID
 * @param {string} rowId - The row ID
 * @param {string} playerId - The player ID
 * @param {string} playerName - The player name
 * @param {boolean} checkedIn - The check-in status
 * @returns {Promise<Object>} - Updated check-in record
 */
const updateCheckInStatus = async (
  tournamentId,
  rowId,
  playerId,
  playerName,
  checkedIn
) => {
  try {
    return await CheckIn.findOneAndUpdate(
      { tournamentId, rowId, playerId },
      {
        tournamentId,
        rowId,
        playerId,
        playerName,
        checkedIn,
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("Error updating check-in status:", error);
    throw new Error("Failed to update check-in status");
  }
};

/**
 * Bulk update check-in status for multiple players
 * @param {string} tournamentId - The tournament ID
 * @param {string} rowId - The row ID
 * @param {Array<Object>} players - Array of player objects with playerId, playerName, and checkedIn status
 * @returns {Promise<Array>} - Array of updated check-in records
 */
const bulkUpdateCheckInStatus = async (tournamentId, rowId, players) => {
  try {
    const bulkOps = players.map((player) => ({
      updateOne: {
        filter: { tournamentId, rowId, playerId: player.playerId },
        update: {
          tournamentId,
          rowId,
          playerId: player.playerId,
          playerName: player.playerName,
          checkedIn: player.checkedIn,
        },
        upsert: true,
      },
    }));

    await CheckIn.bulkWrite(bulkOps);

    // Return the updated records
    return await getCheckInStatus(tournamentId, rowId);
  } catch (error) {
    console.error("Error performing bulk check-in update:", error);
    throw new Error("Failed to update multiple check-in statuses");
  }
};

/**
 * Delete check-in records for a tournament
 * @param {string} tournamentId - The tournament ID
 * @returns {Promise<Object>} - Result of deletion operation
 */
const deleteCheckInsForTournament = async (tournamentId) => {
  try {
    const result = await CheckIn.deleteMany({ tournamentId });
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error("Error deleting check-in records:", error);
    throw new Error("Failed to delete check-in records");
  }
};

/**
 * Get all players checked in for a tournament
 * @param {string} tournamentId - The tournament ID
 * @returns {Promise<Array>} - Array of checked-in players
 */
const getCheckedInPlayers = async (tournamentId) => {
  try {
    return await CheckIn.find({
      tournamentId,
      checkedIn: true,
    })
      .sort({ createdAt: -1 })
      .lean();
  } catch (error) {
    console.error("Error fetching checked-in players:", error);
    throw new Error("Failed to fetch checked-in players");
  }
};

module.exports = {
  getCheckInStatus,
  updateCheckInStatus,
  bulkUpdateCheckInStatus,
  deleteCheckInsForTournament,
  getCheckedInPlayers,
};
