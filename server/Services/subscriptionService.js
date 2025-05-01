const SubscriptionService = require("../models/Subscription");
const webPush = require("web-push");
const SubscriptionPreference = require("../models/subscriptionPreferenceSchema");
const { v4: uuidv4 } = require("uuid");
const NotificationHistory = require("../models/NotificationHistory");
const logger = require("../config/logger");

// Configure VAPID keys
const vapidKeys = {
  publicKey:
    process.env.VAPID_PUBLIC_KEY ||
    "BNs6vAoTALj4B4HwsVW3Kz6y3EYGc6XK5ZjM9V3QH42XDolvBKNQNmMBkThCu6TualLn5ZMzpydHp74wrk7aqXY",
  privateKey:
    process.env.VAPID_PRIVATE_KEY ||
    "qQte9v2HUtpVMYqMMu-BstuVKMcgHP8ZehaOHGoFnEw",
};

webPush.setVapidDetails(
  "mailto:your-email@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const saveSubscription = async (subscription, userId) => {
  try {
    // Validate inputs
    if (!subscription || !userId) {
      throw new Error("Missing subscription or userId");
    }
    if (
      !subscription.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      throw new Error("Invalid subscription data: missing required fields");
    }

    // Check if subscription already exists for the user
    const existingSubscription = await SubscriptionService.findOne({
      userId,
      "keys.p256dh": subscription.keys.p256dh,
      "keys.auth": subscription.keys.auth,
    });

    if (existingSubscription) {
      logger.info("SubscriptionService: Subscription already exists", {
        userId,
      });
      return existingSubscription; // Return the existing subscription
    }

    // Save the new subscription
    const newSubscription = await SubscriptionService.create({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      userId,
    });

    logger.info("SubscriptionService: New subscription created", { userId });
    return newSubscription;
  } catch (error) {
    logger.error("SubscriptionService: Error saving subscription:", {
      error: error.message,
    });
    throw error;
  }
};

const sendNotification = async (userId, title, body, category) => {
  try {
    const image =
      "https://www.smash.dk/wp-content/uploads/2021/05/SMASH-neg-udenby@4x.png"; // Default image URL
    const filter = userId ? { userId } : {};
    const subscriptions = await SubscriptionService.find(filter);

    if (!subscriptions.length) {
      logger.info("SubscriptionService: No subscriptions found for user", {
        userId,
      });
      return;
    }

    // Process each subscription
    const notificationPromises = [];

    const notificationId = uuidv4(); // Generate unique notification ID

    // Save notification to history
    await NotificationHistory.create({
      userId,
      notificationId,
      title,
      body,
      category,
    });

    for (const subscription of subscriptions) {
      // Check user preferences if a category is specified
      if (category) {
        const userPrefs = await SubscriptionPreference.findOne({
          userId: subscription.userId,
        });

        // Skip if user has disabled this notification category
        if (
          userPrefs &&
          userPrefs.preferences &&
          userPrefs.preferences[category] === false
        ) {
          logger.info(
            "SubscriptionService: User has disabled notifications for category",
            {
              userId: subscription.userId,
              category,
            }
          );
          continue;
        }
      }

      const sub = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      };

      const payload = JSON.stringify({
        notification: {
          title,
          body,
          image,
          category,
          notificationId,
        },
      });

      notificationPromises.push(
        webPush
          .sendNotification(sub, payload)
          .then(() =>
            logger.info("SubscriptionService: Notification sent", {
              endpoint: subscription.endpoint,
            })
          )
          .catch((error) =>
            logger.error("SubscriptionService: Error sending notification", {
              endpoint: subscription.endpoint,
              error: error.message,
            })
          )
      );
    }

    await Promise.all(notificationPromises);
  } catch (error) {
    logger.error("SubscriptionService: Error in sendNotification", {
      error: error.message,
    });
    throw error;
  }
};

// Function to handle padel match notifications
const sendPadelMatchNotification = async (eventType, matchDetails, userIds) => {
  try {
    const { matchId, requesterId, participantIds = [] } = matchDetails;

    const notificationScenarios = {
      REQUEST_TO_JOIN_LEVEL: {
        title: "Ny tilmeldingsanmodning",
        body: `En spiller har anmodet om at deltage på dit niveau i kamp ${matchId}.`,
        category: "makkerbors",
        recipients: participantIds,
      },
      REQUEST_PROCESSED: {
        title: "Anmodning behandlet",
        body: `Din anmodning til kamp ${matchId} er blevet behandlet.`,
        category: "makkerbors",
        recipients: [requesterId],
      },
      INVITATION_SENT: {
        title: "Ny invitation til kamp",
        body: `Du er blevet inviteret til kamp ${matchId}.`,
        category: "makkerbors",
        recipients: userIds,
      },
      INVITATION_PROCESSED: {
        title: "Invitation behandlet",
        body: `Invitationen til kamp ${matchId} er blevet behandlet.`,
        category: "makkerbors",
        recipients: participantIds,
      },
      MATCH_FULL: {
        title: "Kamp fyldt",
        body: `Kamp ${matchId} er nu fyldt.`,
        category: "makkerbors",
        recipients: participantIds,
      },
      MATCH_CANCELED_DEADLINE: {
        title: "Kamp aflyst pga. frist",
        body: `Kamp ${matchId} er blevet aflyst på grund af fristen.`,
        category: "makkerbors",
        recipients: participantIds,
      },
      MATCH_CANCELED_BY_MATCH: {
        title: "Kamp aflyst",
        body: `Kamp ${matchId} er blevet aflyst af kampen.`,
        category: "makkerbors",
        recipients: participantIds,
      },
    };

    if (!notificationScenarios[eventType]) {
      throw new Error(`Invalid event type: ${eventType}`);
    }

    const { title, body, category, recipients } =
      notificationScenarios[eventType];

    if (!recipients || recipients.length === 0) {
      logger.info("No recipients specified for notification", {
        eventType,
        matchId,
      });
      return;
    }

    const notificationPromises = recipients.map((userId) =>
      sendNotification(userId, title, body, category)
    );

    await Promise.all(notificationPromises);
    logger.info("Padel match notifications sent", {
      eventType,
      matchId,
      recipients,
    });
  } catch (error) {
    logger.error("Error in sendPadelMatchNotification", {
      eventType,
      matchId: matchDetails.matchId,
      error: error.message,
    });
    throw error;
  }
};

// Function to handle private event notifications
const sendPrivateEventNotification = async (
  eventType,
  eventDetails,
  userIds
) => {
  try {
    const { eventId, requesterId, participantIds = [] } = eventDetails;

    const notificationScenarios = {
      REQUEST_TO_JOIN_EVENT: {
        title: "Ny tilmeldingsanmodning",
        body: `En bruger har anmodet om at deltage i dit private arrangement ${eventId}.`,
        category: "events",
        recipients: participantIds,
      },
      REQUEST_PROCESSED: {
        title: "Anmodning behandlet",
        body: `Din anmodning til arrangement ${eventId} er blevet behandlet.`,
        category: "events",
        recipients: [requesterId],
      },
      INVITATION_SENT: {
        title: "Ny invitation til arrangement",
        body: `Du er blevet inviteret til arrangement ${eventId}.`,
        category: "events",
        recipients: userIds,
      },
      INVITATION_PROCESSED: {
        title: "Invitation behandlet",
        body: `Invitationen til arrangement ${eventId} er blevet behandlet.`,
        category: "events",
        recipients: participantIds,
      },
      EVENT_FULL: {
        title: "Arrangement fyldt",
        body: `Arrangement ${eventId} er nu fyldt.`,
        category: "events",
        recipients: participantIds,
      },
      EVENT_CANCELED_DEADLINE: {
        title: "Arrangement aflyst pga. frist",
        body: `Arrangement ${eventId} er blevet aflyst på grund af fristen.`,
        category: "events",
        recipients: participantIds,
      },
      EVENT_CANCELED_BY_CREATOR: {
        title: "Arrangement aflyst",
        body: `Arrangement ${eventId} er blevet aflyst af arrangøren.`,
        category: "events",
        recipients: participantIds,
      },
    };

    if (!notificationScenarios[eventType]) {
      throw new Error(`Invalid event type: ${eventType}`);
    }

    const { title, body, category, recipients } =
      notificationScenarios[eventType];

    if (!recipients || recipients.length === 0) {
      logger.info("No recipients specified for notification", {
        eventType,
        eventId,
      });
      return;
    }

    const notificationPromises = recipients.map((userId) =>
      sendNotification(userId, title, body, category)
    );

    await Promise.all(notificationPromises);
    logger.info("Private event notifications sent", {
      eventType,
      eventId,
      recipients,
    });
  } catch (error) {
    logger.error("Error in sendPrivateEventNotification", {
      eventType,
      eventId: eventDetails.eventId,
      error: error.message,
    });
    throw error;
  }
};

// New function to handle tournament check-in notifications
const sendTournamentCheckInNotification = async (
  eventType,
  checkInDetails,
  userIds
) => {
  try {
    const {
      tournamentId,
      rowId,
      playerId,
      playerName,
      adminIds = [],
      opponentIds = [],
      partnerIds = [],
    } = checkInDetails;

    const notificationScenarios = {
      PLAYER_CHECKED_IN: {
        title: "Tjekket ind",
        body: `Du er nu tjekket ind til turnering ${tournamentId}, bane ${rowId}.`,
        category: "turneringer",
        recipients: partnerIds, // Notify the partner pair
      },
      PARTNER_CHECKED_IN: {
        title: "Makkerpar tjekket ind",
        body: `Makkerpar ${playerName} er tjekket ind til turnering ${tournamentId}, bane ${rowId}.`,
        category: "turneringer",
        recipients: adminIds, // Notify all admins
      },
      COURT_READY: {
        title: "Bane klar til kamp",
        body: `Banen er klar til kamp i turnering ${tournamentId}, bane ${rowId}.`,
        category: "turneringer",
        recipients: [...partnerIds, ...opponentIds], // Notify partner pair and opponents
      },
    };

    if (!notificationScenarios[eventType]) {
      throw new Error(`Invalid event type: ${eventType}`);
    }

    const { title, body, category, recipients } =
      notificationScenarios[eventType];

    if (!recipients || recipients.length === 0) {
      logger.info("No recipients specified for notification", {
        eventType,
        tournamentId,
        rowId,
      });
      return;
    }

    const notificationPromises = recipients.map((userId) =>
      sendNotification(userId, title, body, category)
    );

    await Promise.all(notificationPromises);
    logger.info("Tournament check-in notifications sent", {
      eventType,
      tournamentId,
      rowId,
      recipients,
    });
  } catch (error) {
    logger.error("Error in sendTournamentCheckInNotification", {
      eventType,
      tournamentId,
      rowId,
      error: error.message,
    });
    throw error;
  }
};

module.exports = {
  saveSubscription,
  sendNotification,
  sendPadelMatchNotification,
  sendPrivateEventNotification,
  sendTournamentCheckInNotification,
};
