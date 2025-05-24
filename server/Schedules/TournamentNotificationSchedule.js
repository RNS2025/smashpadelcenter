// Schedules/TournamentNotificationSchedule.js
const logger = require("../config/logger");
const databaseService = require("../Services/databaseService");
const rankedInService = require("../Services/rankedInService");
const pushNotificationService = require("../Services/pushNotificationService");
const moment = require("moment");

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

// In-memory set to track sent notifications: key = `${username}_${eventId}_${type}`
const sentTournamentNotifications = new Set();

/**
 * Process tournaments for a single user and send notifications if needed
 * @param {Object} user - User object with username and rankedInId
 */
const processUserTournaments = async (user) => {
  if (!user.username || !user.rankedInId) {
    logger.warn("Invalid user data for tournament processing", { user });
    return;
  }

  logger.info(
    `Processing tournaments for user: ${user.username}, rankedInId: ${user.rankedInId}`
  );

  try {
    // Get player details from RankedIn API
    const playerDetails = await rankedInService.getPlayerDetails(
      user.rankedInId,
      "da"
    );

    if (!playerDetails || !playerDetails.Header?.PlayerId) {
      logger.warn(`No player details found for rankedInId: ${user.rankedInId}`);
      return;
    }

    const playerId = playerDetails.Header.PlayerId;

    // Get participated events
    const eventsResponse = await rankedInService.getParticipatedEvents(
      playerId,
      "da"
    );

    if (
      !eventsResponse ||
      !eventsResponse.Payload ||
      !Array.isArray(eventsResponse.Payload) ||
      eventsResponse.Payload.length === 0
    ) {
      logger.info(`No events found for user ${user.username}`);
      return;
    }

    const now = new Date();
    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);
    const futureEvents = eventsResponse.Payload.filter((event) => {
      const eventDate = new Date(event.StartDate);
      return eventDate >= todayMidnight;
    });

    if (futureEvents.length === 0) {
      logger.info(`No upcoming events for user ${user.username}`);
      return;
    }

    // Sort events by start date and get the next event
    const upcomingEvent = futureEvents.sort(
      (a, b) =>
        new Date(a.StartDate).getTime() - new Date(b.StartDate).getTime()
    )[0];

    // Calculate days until event
    const eventDate = moment(upcomingEvent.StartDate).format("DD. MMMM YYYY");
    const eventStart = new Date(upcomingEvent.StartDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    const timeUntil = Math.ceil(
      (eventStart.getTime() - todayMidnight.getTime()) / msPerDay
    );

    // Determine notification type
    let notificationType = null;
    if (timeUntil === 6) {
      notificationType = "6days";
    } else if (timeUntil === 1) {
      notificationType = "1day";
    } else if (timeUntil === 0) {
      // Only send on the day at 07:00 (±2 min)
      const nowHour = now.getHours();
      const nowMin = now.getMinutes();
      if (nowHour === 7 && nowMin <= 2) {
        notificationType = "dayof";
      }
    }
    if (!notificationType) {
      logger.debug(
        `Skipping notification for ${user.username}, tournament in ${timeUntil} days`
      );
      return;
    }
    // Prevent duplicate notifications
    const notificationKey = `${user.username}_${upcomingEvent.Id}_${notificationType}`;
    if (sentTournamentNotifications.has(notificationKey)) {
      logger.debug(`Notification already sent for key: ${notificationKey}`);
      return;
    }
    sentTournamentNotifications.add(notificationKey);

    // Get event matches
    const eventMatches = await rankedInService.getEventMatches(
      upcomingEvent.Id,
      "da"
    );
    let matches = [];
    let upcomingMatches = [];

    if (eventMatches && Array.isArray(eventMatches.Matches)) {
      matches = eventMatches.Matches;
      upcomingMatches = matches.filter((match) => {
        const matchDate = match.date ? new Date(match.date) : null;
        return matchDate && matchDate > now;
      });
    }

    // Create notification message
    let message = `Din turnering "${upcomingEvent.Name}" starter ${eventDate}`;
    if (notificationType === "1day") {
      message += " i morgen!";
    } else if (notificationType === "6days") {
      message += " om en lille uge!";
    } else if (notificationType === "dayof") {
      message += " i dag!";
    }
    if (upcomingMatches.length > 0) {
      message += ` Du har ${upcomingMatches.length} kommende kamp${
        upcomingMatches.length > 1 ? "e" : ""
      }`;
    } // Send notification
    await pushNotificationService.sendToUser(user.username, {
      title: "🎾 Turnering påmindelse",
      message,
      type: "info",
      route: `/tournament/player/${user.rankedInId}`,
      data: {
        tournamentId: upcomingEvent.Id,
        tournamentName: upcomingEvent.Name,
        eventDate: upcomingEvent.StartDate,
        matchCount: matches.length,
      },
    });

    logger.info(
      `Tournament notification sent to user ${user.username} for tournament ${upcomingEvent.Name} (${notificationType}) - username: ${user.username}`
    );
  } catch (error) {
    logger.error(
      `Error processing tournaments for user ${user.username}:`,
      error
    );
  }
};

/**
 * Check for upcoming matches and notify users 30 minutes before their match
 * This runs on a frequent schedule (e.g., every 5 minutes)
 */
const checkAndNotifyAboutUpcomingMatches = async () => {
  try {
    logger.info("Starting upcoming match notification check");

    // Get all users with rankedInId
    const users = await databaseService.getAllUsersWithRankedInId();

    if (!users || users.length === 0) {
      logger.info("No users with rankedInId found for match notifications");
      return;
    }

    logger.info(`Found ${users.length} users to check for upcoming matches`);

    // Process each user
    for (const user of users) {
      try {
        await processUserUpcomingMatches(user);
      } catch (error) {
        logger.error(
          `Error processing upcoming matches for user ${user.username}:`,
          error
        );
      }
    }

    logger.info("Upcoming match notification check completed");
  } catch (error) {
    logger.error("Error in upcoming match notification scheduler:", error);
  }
};

const sentMatchNotifications = new Set(); // key: `${match.MatchId}_${type}`

/**
 * Process upcoming matches for a single user and send notifications if needed
 * @param {Object} user - User object with username and rankedInId
 */
const processUserUpcomingMatches = async (user) => {
  if (!user.username || !user.rankedInId) {
    logger.warn("Invalid user data for match notification processing", {
      user,
    });
    return;
  }

  logger.info(
    `Processing upcoming matches for user: ${user.username}, rankedInId: ${user.rankedInId}`
  );

  try {
    // Get player details from RankedIn API
    const playerDetails = await rankedInService.getPlayerDetails(
      user.rankedInId,
      "da"
    );

    if (!playerDetails || !playerDetails.Header?.PlayerId) {
      logger.warn(`No player details found for rankedInId: ${user.rankedInId}`);
      return;
    }

    const playerId = playerDetails.Header.PlayerId;

    // Get upcoming player matches
    const matchesResponse = await rankedInService.getPlayerMatches(
      playerId,
      false, // don't include history
      0, // skip
      10, // take
      "da" // language
    );

    if (
      !matchesResponse ||
      !matchesResponse.Payload ||
      !Array.isArray(matchesResponse.Payload) ||
      matchesResponse.Payload.length === 0
    ) {
      logger.info(`No matches found for user ${user.username}`);
      return;
    }

    const now = new Date();
    for (const match of matchesResponse.Payload) {
      const info = match.Info || {};
      const matchId = match.MatchId;
      const matchTimeStr = info.Date || null;
      const court = info.Court || "TBD";
      let matchDate = null;
      if (matchTimeStr) {
        // Try to parse 'DD/MM/YYYY HH:mm' or ISO
        matchDate = moment(
          matchTimeStr,
          ["DD/MM/YYYY HH:mm", moment.ISO_8601],
          true
        );
        if (!matchDate.isValid()) {
          logger.warn(
            `Invalid match date format for matchId ${matchId}: ${matchTimeStr}`
          );
          continue;
        }
      } else {
        logger.warn(`Missing match date for matchId ${matchId}`);
        continue;
      }

      const diffMs = matchDate.toDate().getTime() - now.getTime();
      const diffMin = Math.round(diffMs / 60000);

      // Only send notification if match is in 30 min (±1 min) or at start (±1 min)
      let type = null;
      if (diffMin >= 29 && diffMin <= 31) {
        type = "30min";
      } else if (diffMin >= -1 && diffMin <= 1) {
        type = "start";
      } else {
        continue;
      }
      // Prevent duplicate notifications for the same match and type
      const notificationKey = `${matchId}_${type}`;
      if (sentMatchNotifications.has(notificationKey)) {
        continue;
      }
      sentMatchNotifications.add(notificationKey);

      // Build opponents string
      let opponents = "Modstander";
      if (info.Challenger && info.Challenged) {
        const challengerName =
          info.Challenger.Name || JSON.stringify(info.Challenger);
        const challengedName =
          info.Challenged.Name || JSON.stringify(info.Challenged);
        opponents = `${challengerName} vs ${challengedName}`;
      }

      let message = "";
      let title = "";
      if (type === "30min") {
        message = `Din kamp starter om 30 minutter! Kl. ${matchDate.format(
          "HH:mm"
        )} på bane ${court} mod ${opponents}`;
        title = "⏰ Kamp påmindelse";
      } else if (type === "start") {
        message = `Din kamp starter nu! Kl. ${matchDate.format(
          "HH:mm"
        )} på bane ${court} mod ${opponents}`;
        title = "🎾 Kamp fundet";
      }
      await pushNotificationService.sendToUser(user.username, {
        title,
        message,
        type: type === "30min" ? "warning" : "info",
        route: `/tournament/player/${user.rankedInId}`,
        data: {
          matchId: matchId,
          matchTime: matchDate.toISOString(),
          court: court,
          opponents: opponents,
        },
      });

      logger.info(
        `Match notification (${type}) sent to user ${
          user.username
        } for match at ${matchDate.format("HH:mm")} - username: ${
          user.username
        }`
      );
    }
  } catch (error) {
    logger.error(
      `Error processing upcoming matches for user ${user.username}:`,
      error
    );
  }
};

// Exposed for testing
const testFunctions = {
  checkAndNotify: checkAndNotifyAboutTournaments,
  processUserTournaments,
  checkAndNotifyAboutUpcomingMatches,
  processUserUpcomingMatches,
};

module.exports = {
  checkAndNotifyAboutTournaments,
  checkAndNotifyAboutUpcomingMatches,
  ...testFunctions,
};
