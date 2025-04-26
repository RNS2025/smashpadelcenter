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

module.exports = {
  saveSubscription,
  sendNotification,
};
