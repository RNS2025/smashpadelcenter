// Schedules/TournamentNotificationSchedule.js
const logger = require("../config/logger");
const databaseService = require("../Services/databaseService");
const rankedInService = require("../Services/rankedInService");
const pushNotificationService = require("../Services/pushNotificationService");
const moment = require("moment");
const NotificationHelper = require("../utils/notificationHelper");

/**
 * Check for upcoming tournaments and notify users
 * This runs on a schedule to notify users about their tournaments
 */
const checkAndNotifyAboutTournaments = async () => {
  try {
    logger.info("Starting tournament notification check");

    // Get all users with rankedInId
    const users = await databaseService.getAllUsersWithRankedInId();

    if (!users || users.length === 0) {
      logger.info("No users with rankedInId found");
      return;
    }

    logger.info(`Found ${users.length} users with rankedInId`);

    // Process each user
    for (const user of users) {
      try {
        await processUserTournaments(user);
      } catch (error) {
        logger.error(
          `Error processing tournaments for user ${user.username}:`,
          error
        );
      }
    }

    logger.info("Tournament notification check completed");
  } catch (error) {
    logger.error("Error in tournament notification scheduler:", error);
  }
};

// Refactored: Use NotificationHelper for all notifications and simplify logic

// In-memory sets to prevent duplicate notifications
const sentTournamentNotifications = new Set();
const sentMatchNotifications = new Set();

/**
 * Notify user about their next tournament (7 days, 2 days, and on game day)
 * @param {Object} user - User object with username and rankedInId
 */
const notifyUserNextTournament = async (user) => {
  if (!user.username || !user.rankedInId) return;
  try {
    const playerDetails = await rankedInService.getPlayerDetails(
      user.rankedInId,
      "da"
    );
    if (!playerDetails?.Header?.PlayerId) return;
    const playerId = playerDetails.Header.PlayerId;
    const eventsResponse = await rankedInService.getParticipatedEvents(
      playerId,
      "da"
    );
    if (
      !Array.isArray(eventsResponse?.Payload) ||
      eventsResponse.Payload.length === 0
    )
      return;
    const now = new Date();
    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayMidnight);
    todayEnd.setHours(23, 59, 59, 999);
    const futureEvents = eventsResponse.Payload.filter(
      (e) => new Date(e.StartDate) >= todayMidnight
    );
    if (futureEvents.length === 0) return;
    const nextEvent = futureEvents.sort(
      (a, b) => new Date(a.StartDate) - new Date(b.StartDate)
    )[0];
    const eventStart = new Date(nextEvent.StartDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysUntil = Math.floor(
      (eventStart.getTime() - todayMidnight.getTime()) / msPerDay
    );
    let notificationType = null;
    if (daysUntil === 7) notificationType = "7days";
    else if (daysUntil === 2) notificationType = "2days";
    // Expanded: check if event is today (any time during the day)
    else if (eventStart >= todayMidnight && eventStart <= todayEnd)
      notificationType = "dayof";
    if (!notificationType) return;
    const notificationKey = `${user.username}_${
      nextEvent.Id
    }_${notificationType}_${todayMidnight.toDateString()}`;
    if (sentTournamentNotifications.has(notificationKey)) return;
    sentTournamentNotifications.add(notificationKey);
    let message = `Din turnering \"${nextEvent.Name}\" starter ${moment(
      nextEvent.StartDate
    ).format("DD. MMMM YYYY")}`;
    if (notificationType === "7days") message += " om en uge!";
    else if (notificationType === "2days") message += " om 2 dage!";
    else if (notificationType === "dayof") message += " i dag!";
    NotificationHelper.notify(
      user.username,
      "🎾 Turnering påmindelse",
      message,
      `/tournament/player/${user.rankedInId}`
    );
  } catch (error) {
    logger.error(`Error notifying user about next tournament:`, error);
  }
};

/**
 * Notify user about upcoming matches (30 min before and at start)
 * @param {Object} user - User object with username and rankedInId
 */
const notifyUserUpcomingMatches = async (user) => {
  if (!user.username || !user.rankedInId) return;
  try {
    const playerDetails = await rankedInService.getPlayerDetails(
      user.rankedInId,
      "da"
    );
    if (!playerDetails?.Header?.PlayerId) return;
    const playerId = playerDetails.Header.PlayerId;
    const matchesResponse = await rankedInService.getPlayerMatches(
      playerId,
      false,
      0,
      10,
      "da"
    );
    if (
      !Array.isArray(matchesResponse?.Payload) ||
      matchesResponse.Payload.length === 0
    )
      return;
    const now = new Date();
    for (const match of matchesResponse.Payload) {
      const info = match.Info || {};
      const matchId = match.MatchId;
      const matchTimeStr = info.Date || null;
      if (!matchTimeStr) continue;
      const matchDate = moment(
        matchTimeStr,
        ["DD/MM/YYYY HH:mm", moment.ISO_8601],
        true
      );
      if (!matchDate.isValid()) continue;
      const diffMin = Math.round(
        (matchDate.toDate().getTime() - now.getTime()) / 60000
      );
      let type = null;
      // Expanded: use ±3 min window for robustness
      if (diffMin >= 27 && diffMin <= 33) type = "30min";
      else if (diffMin >= -3 && diffMin <= 3) type = "start";
      else continue;
      const notificationKey = `${matchId}_${type}`;
      if (sentMatchNotifications.has(notificationKey)) continue;
      sentMatchNotifications.add(notificationKey);
      let opponents = "Modstander";
      if (info.Challenger && info.Challenged) {
        const challengerName =
          info.Challenger.Name || JSON.stringify(info.Challenger);
        const challengedName =
          info.Challenged.Name || JSON.stringify(info.Challenged);
        opponents = `${challengerName} vs ${challengedName}`;
      }
      let title = type === "30min" ? "⏰ Kamp påmindelse" : "🎾 Kamp fundet";
      let message =
        type === "30min"
          ? `Din kamp starter om 30 minutter! Kl. ${matchDate.format(
              "HH:mm"
            )} på bane ${info.Court || "TBD"} mod ${opponents}`
          : `Din kamp starter nu! Kl. ${matchDate.format("HH:mm")} på bane ${
              info.Court || "TBD"
            } mod ${opponents}`;
      NotificationHelper.notify(
        user.username,
        title,
        message,
        `/tournament/player/${user.rankedInId}`
      );
    }
  } catch (error) {
    logger.error(`Error notifying user about upcoming matches:`, error);
  }
};

/**
 * Run daily tournament notifications for all users
 */
const notifyAllUsersNextTournament = async () => {
  const users = await databaseService.getAllUsersWithRankedInId();
  if (!users || users.length === 0) return;
  for (const user of users) {
    await notifyUserNextTournament(user);
  }
};

/**
 * Run frequent match notifications for all users
 */
const notifyAllUsersUpcomingMatches = async () => {
  const users = await databaseService.getAllUsersWithRankedInId();
  if (!users || users.length === 0) return;
  for (const user of users) {
    await notifyUserUpcomingMatches(user);
  }
};

// Expose for scheduling and testing
module.exports = {
  notifyAllUsersNextTournament, // run on schedule
  notifyAllUsersUpcomingMatches, // run as often as needed
  notifyUserNextTournament, // for test endpoint
  notifyUserUpcomingMatches, // for test endpoint
  // Backward compatibility exports for legacy code
  checkAndNotifyAboutTournaments: notifyAllUsersNextTournament,
  checkAndNotifyAboutUpcomingMatches: notifyAllUsersUpcomingMatches,
};
