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
    const futureEvents = eventsResponse.Payload.filter((event) => {
      const eventDate = new Date(event.StartDate);
      return eventDate >= new Date(now.setHours(0, 0, 0, 0));
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
    const timeUntil = Math.ceil(
      (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

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

    if (timeUntil === 0) {
      message += " i dag!";
    } else if (timeUntil === 1) {
      message += " i morgen!";
    } else if (timeUntil > 1) {
      message += ` om ${timeUntil} dage`;
    } else {
      message += " og er i gang!";
    }

    if (upcomingMatches.length > 0) {
      message += ` Du har ${upcomingMatches.length} kommende kamp${
        upcomingMatches.length > 1 ? "e" : ""
      }`;
    }

    // Send notification
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
      `Tournament notification sent to user ${user.username} for tournament ${upcomingEvent.Name}`
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
      !matchesResponse.Matches ||
      !Array.isArray(matchesResponse.Matches) ||
      matchesResponse.Matches.length === 0
    ) {
      logger.info(`No upcoming matches found for user ${user.username}`);
      return;
    }

    const now = new Date();
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;

    // Find matches that are starting within the next 30 minutes
    const upcomingMatches = matchesResponse.Matches.filter((match) => {
      if (!match.Date) return false;

      const matchDate = new Date(match.Date);
      const timeDiffMs = matchDate.getTime() - now.getTime();

      // Match starting between now and 30 minutes from now
      return timeDiffMs > 0 && timeDiffMs <= THIRTY_MINUTES_MS;
    });

    if (upcomingMatches.length === 0) {
      logger.debug(
        `No matches starting within 30 minutes for user ${user.username}`
      );
      return;
    }

    // Send notification for each upcoming match
    for (const match of upcomingMatches) {
      const matchTime = moment(match.Date).format("HH:mm");
      const court = match.Court || "TBD";

      // Create opponent string
      let opponents = "Modstander";
      if (match.Opponents && match.Opponents.length > 0) {
        opponents = match.Opponents.map((o) => o.Name).join(" & ");
      }

      const message = `Din kamp starter om 30 minutter! Kl. ${matchTime} på bane ${court} mod ${opponents}`;

      await pushNotificationService.sendToUser(user.username, {
        title: "⏰ Kamp påmindelse",
        message,
        type: "warning", // Higher priority for imminent matches
        route: `/tournament/player/${user.rankedInId}`,
        data: {
          matchId: match.Id,
          matchTime: match.Date,
          court: court,
          opponents: match.Opponents,
        },
      });

      logger.info(
        `Match notification sent to user ${user.username} for match at ${matchTime}`
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
