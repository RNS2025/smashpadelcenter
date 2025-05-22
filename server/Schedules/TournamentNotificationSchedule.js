const axios = require("axios");
const cron = require("node-cron");
const { sendNotification } = require("../Services/subscriptionService");
const logger = require("../config/logger");
const moment = require("moment");

// Function to fetch player ID from RankedIn ID
async function getPlayerId(rankedInId, mockResponse = null) {
  if (mockResponse) {
    return mockResponse.PlayerId;
  }
  try {
    const response = await axios.get(
      `https://api.rankedin.com/v1/player/playerprofileinfoasync?rankedinId=${rankedInId}&language=en`
    );
    return response.data.Header.PlayerId;
  } catch (error) {
    logger.error("Error fetching player ID:", {
      rankedInId,
      error: error.message,
    });
    throw error;
  }
}

// Function to fetch participated events for a player
async function getParticipatedEvents(playerId, mockResponse = null) {
  if (mockResponse) {
    return mockResponse;
  }
  try {
    const response = await axios.get(
      `https://api.rankedin.com/v1/player/ParticipatedEventsAsync?playerId=${playerId}&language=en&skip=0&take=10`
    );
    return response.data;
  } catch (error) {
    logger.error("Error fetching participated events:", {
      playerId,
      error: error.message,
    });
    throw error;
  }
}

// Function to fetch upcoming matches for a player
async function getPlayerMatches(playerId, mockResponse = null) {
  if (mockResponse) {
    return mockResponse;
  }
  try {
    const response = await axios.get(
      `https://api.rankedin.com/v1/player/GetPlayerMatchesAsync?playerid=${playerId}&takehistory=false&skip=0&take=10&language=en`
    );
    return response.data;
  } catch (error) {
    logger.error("Error fetching player matches:", {
      playerId,
      error: error.message,
    });
    throw error;
  }
}

// Function to check for upcoming tournaments and matches and send notifications
async function checkAndNotify(user, mockOptions = {}) {
  const {
    mockPlayerResponse,
    mockEventsResponse,
    mockMatchesResponse,
    testDate,
  } = mockOptions;
  try {
    const { rankedInId, userId } = user;
    if (!rankedInId || !userId) {
      logger.warn("Missing rankedInId or userId for user", { user });
      return {
        success: false,
        message: "Missing rankedInId or userId",
        notifications: [],
      };
    }

    // Fetch player ID
    const playerId = await getPlayerId(rankedInId, mockPlayerResponse);
    if (!playerId) {
      logger.warn("No player ID found for rankedInId", { rankedInId });
      return {
        success: false,
        message: "No player ID found",
        notifications: [],
      };
    }

    // Use testDate if provided, else use current date
    const referenceDate = testDate ? moment(testDate) : moment();

    // Track notifications sent
    const notifications = []; // Check for upcoming tournaments
    const eventsData = await getParticipatedEvents(
      playerId,
      mockEventsResponse
    );
    const events = eventsData?.Events || [];
    const tomorrow = referenceDate.clone().add(1, "day").startOf("day");
    const tomorrowEnd = referenceDate.clone().add(1, "day").endOf("day");

    for (const event of events) {
      const eventDate = moment(event.StartDate);
      if (
        event.Type === "Tournament" &&
        eventDate.isBetween(tomorrow, tomorrowEnd, null, "[]")
      ) {
        const title = `Tournament Reminder: ${event.Title}`;
        const body = `Your tournament "${
          event.Title
        }" is tomorrow at ${eventDate.format(
          "MMMM Do YYYY, h:mm a"
        )}. Get ready!`;
        const category = "turneringer";

        await sendNotification(userId, title, body, category);
        notifications.push({
          userId,
          tournamentId: event.Id,
          title,
          body,
          category,
        });

        logger.info("Tournament notification sent", {
          userId,
          tournamentId: event.Id,
          title: event.Title,
        });
      }
    }

    // Check for upcoming matches
    const matchesData = await getPlayerMatches(playerId, mockMatchesResponse);
    const matches = matchesData?.Payload || [];
    const in30Minutes = referenceDate.clone().add(30, "minutes");
    const in60Minutes = referenceDate.clone().add(60, "minutes");

    for (const match of matches) {
      const matchDate = moment(match.Info.Date, "MM/DD/YYYY HH:mm:ss");
      if (matchDate.isBetween(in30Minutes, in60Minutes, null, "[]")) {
        const title = `Match Reminder: ${match.Info.EventName}`;
        const body = `Your match at ${
          match.Info.Location
        } is in 30 minutes at ${matchDate.format("h:mm a")}!`;
        const category = "matches";

        await sendNotification(userId, title, body, category);
        notifications.push({
          userId,
          matchId: match.MatchId,
          title,
          body,
          category,
        });

        logger.info("Match notification sent", {
          userId,
          matchId: match.MatchId,
          eventName: match.Info.EventName,
        });
      }
    }

    return { success: true, notifications };
  } catch (error) {
    logger.error("Error in checkAndNotify:", {
      userId: user.userId,
      error: error.message,
    });
    return { success: false, message: error.message, notifications: [] };
  }
}

// Main scheduler function for tournaments
function startTournamentScheduler() {
  // Schedule to run every day at 8 PM (20:00) to send notifications for tournaments happening the next day
  cron.schedule("0 20 * * *", async () => {
    logger.info(
      "Starting tournament notification scheduler - evening notifications for tomorrow's tournaments"
    );
    try {
      const User = require("../models/user"); // Adjust path as needed
      const users = await User.find({ rankedInId: { $exists: true } });

      const notificationPromises = users.map((user) => checkAndNotify(user));
      await Promise.all(notificationPromises);

      logger.info("Tournament notification scheduler completed");
    } catch (error) {
      logger.error("Error in tournament notification scheduler:", {
        error: error.message,
      });
    }
  });
}

// Main scheduler function for matches
function startMatchScheduler() {
  // Schedule to run every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    logger.info("Starting match notification scheduler");
    try {
      const User = require("../models/user"); // Adjust path as needed
      const users = await User.find({ rankedInId: { $exists: true } });

      const notificationPromises = users.map((user) => checkAndNotify(user));
      await Promise.all(notificationPromises);

      logger.info("Match notification scheduler completed");
    } catch (error) {
      logger.error("Error in match notification scheduler:", {
        error: error.message,
      });
    }
  });
}

// Combined scheduler startup
function startNotificationScheduler() {
  startTournamentScheduler();
  startMatchScheduler();
}

// Test function to manually trigger notification check
async function testCheckAndNotify(user, mockOptions = {}) {
  return await checkAndNotify(user, mockOptions);
}

module.exports = {
  startNotificationScheduler,
  testCheckAndNotify,
  getPlayerId,
  getParticipatedEvents,
  getPlayerMatches,
  checkAndNotify,
};
