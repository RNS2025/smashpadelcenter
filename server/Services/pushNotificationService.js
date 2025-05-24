// Services/pushNotificationService.js
const logger = require("../config/logger");
const webPush = require("web-push");

// Debug environment variable loading
logger.info(`[VAPID] Environment: ${process.env.NODE_ENV}`);
logger.info(
  `[VAPID] VAPID_PUBLIC_KEY exists: ${!!process.env.VAPID_PUBLIC_KEY}`
);
logger.info(
  `[VAPID] VAPID_PRIVATE_KEY exists: ${!!process.env.VAPID_PRIVATE_KEY}`
);

// Configure VAPID keys - these should be environment variables in production
const vapidKeys = {
  publicKey:
    process.env.VAPID_PUBLIC_KEY ||
    "BDWRaZ84j6b5beFz-M_2B4MQM22bZZ1zk2YQtb2NaXt5unyJLzNYxexw_CyETRd_g9FHHn0zKWEdkvOeJg1hyAU",
  privateKey:
    process.env.VAPID_PRIVATE_KEY ||
    "yw1RlFD21TP3Y7NvLt1LfXNgPSAmEolyftGSQlaigFI",
};

logger.info(
  `[VAPID] Using public key: ${vapidKeys.publicKey.substring(0, 20)}...`
);
logger.info(
  `[VAPID] Using private key: ${vapidKeys.privateKey.substring(0, 20)}...`
);

webPush.setVapidDetails(
  "mailto:admin@smashpadelcenter.dk",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Require the PushSubscription model
const PushSubscription = require("../models/PushSubscription");

class PushNotificationService {
  constructor() {
    this.subscribers = new Map(); // Store active connections
    this.notificationQueue = new Map(); // Store notifications for offline users
    this.pushSubscriptions = new Map(); // In-memory cache of push subscriptions

    // Load existing subscriptions from database
    this.loadSubscriptionsFromDB();
  }

  /**
   * Load subscriptions from database into memory
   */
  async loadSubscriptionsFromDB() {
    try {
      const subscriptions = await PushSubscription.find({});
      subscriptions.forEach((sub) => {
        this.pushSubscriptions.set(sub.username, sub.subscription);
      });
      logger.info(
        `Loaded ${subscriptions.length} push subscriptions from database`
      );
    } catch (err) {
      logger.error("Failed to load push subscriptions from database:", err);
    }
  }

  /**
   * Add a push subscription for a user (multiple devices supported)
   * @param {string} username - Username
   * @param {Object} subscription - Push subscription object
   */
  async addPushSubscription(username, subscription) {
    try {
      // Store in database (add or update by endpoint)
      await PushSubscription.addSubscription(username, subscription);
      // No longer cache only one per user in memory
      // Optionally, you can cache all for performance if needed
      logger.info(`Push subscription added for user ${username}`);
    } catch (err) {
      logger.error(
        `Failed to store push subscription for user ${username}:`,
        err
      );
    }
  }

  /**
   * Remove a specific push subscription for a user (by endpoint)
   * @param {string} username - Username
   * @param {string} endpoint - Push subscription endpoint
   */
  async removePushSubscription(username, endpoint) {
    try {
      await PushSubscription.removeSubscription(username, endpoint);
      logger.info(
        `Push subscription removed for user ${username} (endpoint: ${endpoint})`
      );
    } catch (err) {
      logger.error(
        `Failed to remove push subscription for user ${username} (endpoint: ${endpoint}):`,
        err
      );
    }
  }

  /**
   * Get VAPID public key
   * @returns {string} VAPID public key
   */
  getVapidPublicKey() {
    return vapidKeys.publicKey;
  }
  /**
   * Send web push notification to all devices for a user
   * @param {string} username - Target username
   * @param {Object} notification - Notification data
   */
  async sendWebPush(username, notification) {
    logger.info(
      `Attempting to send web push to user: ${username}, notification: ${notification.title}`
    );

    // Get all subscriptions for the user
    let subscriptions = [];
    try {
      subscriptions = await PushSubscription.getAllForUser(username);
      logger.info(
        `Found ${subscriptions.length} subscriptions for user ${username}`
      );
    } catch (err) {
      logger.error(
        `Failed to fetch subscriptions for ${username} from DB:`,
        err
      );
    }
    if (!subscriptions.length) {
      logger.warn(
        `No push subscriptions found for user ${username} - cannot send web push notification`
      );
      return false;
    }
    const pushPayload = JSON.stringify(this.formatNotification(notification));
    let success = false;
    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(sub.subscription, pushPayload);
        logger.info(
          `Web push notification sent to user ${username} (endpoint: ${sub.subscription.endpoint}):`,
          notification.title
        );
        success = true;
      } catch (error) {
        logger.error(
          `Failed to send web push to user ${username} (endpoint: ${sub.subscription.endpoint}):`,
          {
            statusCode: error.statusCode,
            body: error.body,
            message: error.message,
            stack: error.stack,
          }
        );
        // Remove invalid subscription
        if (error.statusCode === 410 || error.statusCode === 404) {
          await this.removePushSubscription(
            username,
            sub.subscription.endpoint
          );
        }
      }
    }
    logger.info(
      `Web push sending result for user ${username}: ${
        success ? "SUCCESS" : "FAILED"
      }`
    );
    return success;
  }

  /**
   * Add a new subscriber (client connection)
   * @param {string} username - Username
   * @param {Response} res - Express response object for SSE
   */ addSubscriber(username, res) {
    // Headers are already set in the route handler, no need to set them here

    // Store the connection
    this.subscribers.set(username, res);

    // Send any queued notifications
    this.sendQueuedNotifications(username);

    // Handle client disconnect
    res.on("close", () => {
      this.subscribers.delete(username);
      logger.info(`User ${username} disconnected from push notifications`);
    });

    logger.info(`User ${username} connected to push notifications`);
  }
  /**
   * Send a push notification to a specific user
   * @param {string} username - Target username
   * @param {Object} notification - Notification data
   */
  async sendToUser(username, notification) {
    logger.info(
      `[sendToUser] Sending notification to user: ${username}, title: ${notification.title}`
    );

    const formattedNotification = this.formatNotification(notification);

    if (this.subscribers.has(username)) {
      // User is online, send immediately via SSE
      const res = this.subscribers.get(username);
      try {
        res.write(`data: ${JSON.stringify(formattedNotification)}\n\n`);
        logger.info(
          `SSE notification sent to user ${username}:`,
          notification.title
        );
      } catch (error) {
        logger.error(
          `Failed to send SSE notification to user ${username}:`,
          error
        );
        this.subscribers.delete(username);
      }
    } else {
      // User is offline, queue the notification
      logger.info(
        `User ${username} is offline, queueing notification and attempting web push`
      );
      this.queueNotification(username, formattedNotification);
    }

    // Always try to send web push notification for background notifications
    const webPushResult = await this.sendWebPush(username, notification);
    logger.info(
      `[sendToUser] Final result for user ${username}: SSE=${this.subscribers.has(
        username
      )}, WebPush=${webPushResult}`
    );
  }
  /**
   * Send a push notification to multiple users
   * @param {Array} usernames - Array of usernames
   * @param {Object} notification - Notification data
   */
  async sendToUsers(usernames, notification) {
    const promises = usernames.map((username) =>
      this.sendToUser(username, notification)
    );
    await Promise.all(promises);
  }
  /**
   * Broadcast a notification to all connected users
   * @param {Object} notification - Notification data
   */
  broadcast(notification) {
    const formattedNotification = this.formatNotification(notification);

    this.subscribers.forEach((res, username) => {
      try {
        res.write(`data: ${JSON.stringify(formattedNotification)}\n\n`);
      } catch (error) {
        logger.error(`Failed to broadcast to user ${username}:`, error);
        this.subscribers.delete(username);
      }
    });

    logger.info(
      `Broadcast notification sent to ${this.subscribers.size} users:`,
      notification.title
    );
  }

  /**
   * Format notification data
   * @param {Object} notification - Raw notification data
   * @returns {Object} Formatted notification
   */
  formatNotification(notification) {
    return {
      id: notification.id || Date.now().toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type || "info", // info, success, warning, error
      link: notification.link || null,
      route: notification.route || null,
      timestamp: new Date().toISOString(),
      data: notification.data || {},
    };
  }
  /**
   * Queue notification for offline user
   * @param {string} username - Username
   * @param {Object} notification - Formatted notification
   */
  queueNotification(username, notification) {
    if (!this.notificationQueue.has(username)) {
      this.notificationQueue.set(username, []);
    }

    const userQueue = this.notificationQueue.get(username);
    userQueue.push(notification);

    // Keep only last 10 notifications per user
    if (userQueue.length > 10) {
      userQueue.shift();
    }

    logger.info(
      `Notification queued for offline user ${username}:`,
      notification.title
    );
  }

  /**
   * Send queued notifications to newly connected user
   * @param {string} username - Username
   */
  sendQueuedNotifications(username) {
    if (this.notificationQueue.has(username)) {
      const queue = this.notificationQueue.get(username);
      const res = this.subscribers.get(username);

      queue.forEach((notification) => {
        try {
          res.write(`data: ${JSON.stringify(notification)}\n\n`);
        } catch (error) {
          logger.error(
            `Failed to send queued notification to ${username}:`,
            error
          );
        }
      });

      // Clear the queue
      this.notificationQueue.delete(username);
      logger.info(
        `Sent ${queue.length} queued notifications to user ${username}`
      );
    }
  }

  /**
   * Get active subscribers count
   * @returns {number} Number of active subscribers
   */
  getActiveSubscribersCount() {
    return this.subscribers.size;
  }
  /**
   * Check if user is online
   * @param {string} username - Username
   * @returns {boolean} True if user is connected
   */
  isUserOnline(username) {
    return this.subscribers.has(username);
  }
  /**
   * Remove user from service
   * @param {string} username - Username
   */
  removeUser(username) {
    this.subscribers.delete(username);
    this.notificationQueue.delete(username);
    this.pushSubscriptions.delete(username);
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

module.exports = pushNotificationService;
