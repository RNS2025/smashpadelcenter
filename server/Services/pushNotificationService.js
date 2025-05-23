// Services/pushNotificationService.js
const logger = require("../config/logger");
const webPush = require("web-push");

// Configure VAPID keys - these should be environment variables in production
const vapidKeys = {
  publicKey:
    process.env.VAPID_PUBLIC_KEY ||
    "BPlJdgWH7vWk8nUqKu8PIhKD-6lGIgcS9CZnEIWiHYQMz5DpKuKJWmThfAcjKftRYhCqGKyuIZOYDXz7uRYPEaU",
  privateKey:
    process.env.VAPID_PRIVATE_KEY ||
    "PBjmHGUZkJJN5ypKhE7H8tRz5CmUX2F3QjHFx4uY8Vw",
};

webPush.setVapidDetails(
  "mailto:admin@smashpadelcenter.dk",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

class PushNotificationService {
  constructor() {
    this.subscribers = new Map(); // Store active connections
    this.notificationQueue = new Map(); // Store notifications for offline users
    this.pushSubscriptions = new Map(); // Store push subscriptions by username
  }
  /**
   * Add a push subscription for a user
   * @param {string} username - Username
   * @param {Object} subscription - Push subscription object
   */
  addPushSubscription(username, subscription) {
    this.pushSubscriptions.set(username, subscription);
    logger.info(`Push subscription added for user ${username}`);
  }

  /**
   * Remove push subscription for a user
   * @param {string} username - Username
   */
  removePushSubscription(username) {
    this.pushSubscriptions.delete(username);
    logger.info(`Push subscription removed for user ${username}`);
  }

  /**
   * Get VAPID public key
   * @returns {string} VAPID public key
   */
  getVapidPublicKey() {
    return vapidKeys.publicKey;
  }

  /**
   * Send web push notification
   * @param {string} username - Target username
   * @param {Object} notification - Notification data
   */
  async sendWebPush(username, notification) {
    const subscription = this.pushSubscriptions.get(username);
    if (!subscription) {
      logger.warn(`No push subscription found for user ${username}`);
      return false;
    }

    const payload = JSON.stringify(this.formatNotification(notification));

    try {
      await webPush.sendNotification(subscription, payload);
      logger.info(
        `Web push notification sent to user ${username}:`,
        notification.title
      );
      return true;
    } catch (error) {
      logger.error(`Failed to send web push to user ${username}:`, error);

      // Remove invalid subscription
      if (error.statusCode === 410 || error.statusCode === 404) {
        this.removePushSubscription(username);
      }
      return false;
    }
  }

  /**
   * Add a new subscriber (client connection)
   * @param {string} username - Username
   * @param {Response} res - Express response object for SSE
   */
  addSubscriber(username, res) {
    // Set up Server-Sent Events headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

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
      this.queueNotification(username, formattedNotification);
    }

    // Always try to send web push notification for background notifications
    await this.sendWebPush(username, notification);
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
