const SubscriptionService = require("../models/Subscription");
const webPush = require("web-push");

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

const sendNotification = async (userId, title, body, image) => {
  try {
    const filter = userId ? { userId } : {};
    const subscriptions = await SubscriptionService.find(filter);

    if (!subscriptions.length) {
      console.log("No subscriptions found for user:", userId);
      return;
    }

    const notificationPromises = subscriptions.map((subscription) => {
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
        },
      });

      return webPush
        .sendNotification(sub, payload)
        .then(() =>
          console.log(`Notification sent to ${subscription.endpoint}`)
        )
        .catch((error) =>
          console.error(`Error sending to ${subscription.endpoint}:`, error)
        );
    });

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
