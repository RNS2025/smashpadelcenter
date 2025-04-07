const SubscriptionService = require("../models/Subscription");
const webPush = require("web-push");
const SubscriptionPreference = require("../models/subscriptionPreferenceSchema");
const { v4: uuidv4 } = require("uuid");
const NotificationHistory = require("../models/NotificationHistory");

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
      console.log(`Subscription for user ${userId} already exists.`);
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

    return newSubscription;
  } catch (error) {
    console.error("Error saving subscription:", error);
    throw error;
  }
};

const sendNotification = async (userId, title, body, image, category) => {
  try {
    const filter = userId ? { userId } : {};
    const subscriptions = await SubscriptionService.find(filter);

    if (!subscriptions.length) {
      console.log("No subscriptions found for user:", userId);
      return;
    }

    // Process each subscription
    const notificationPromises = [];

    const notificationId = uuidv4(); // Generate unique notification ID

    // Check if the notification was already sent to this user
    const existingNotification = await NotificationHistory.findOne({
      userId,
      notificationId,
    });

    if (existingNotification) {
      console.log(
        `Notification with ID ${notificationId} already sent to user ${userId}.`
      );
      return; // Skip sending if already sent
    }

    // Add to history to mark this notification as sent
    await NotificationHistory.create({
      userId,
      notificationId,
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
          console.log(
            `User ${subscription.userId} has disabled ${category} notifications. Skipping.`
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
            console.log(`Notification sent to ${subscription.endpoint}`)
          )
          .catch((error) =>
            console.error(`Error sending to ${subscription.endpoint}:`, error)
          )
      );
    }

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error("Error in sendNotification:", error);
    throw error;
  }
};

module.exports = {
  saveSubscription,
  sendNotification,
};
