// utils/notificationHelper.js
const pushNotificationService = require("../Services/pushNotificationService");

/**
 * Notification Helper - Global utility for sending push notifications
 * Can be imported and used anywhere in the application
 */
class NotificationHelper {
  /**
   * Send a simple notification to a user
   * @param {string} username - Target username
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} route - Route to navigate when clicked
   */
  static notify(username, title, message, route = null) {
    pushNotificationService.sendToUser(username, {
      title,
      message,
      type: "info",
      route,
    });
  }
  /**
   * Send a success notification
   * @param {string} username - Target username
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} route - Route to navigate when clicked
   */
  static success(username, title, message, route = null) {
    pushNotificationService.sendToUser(username, {
      title,
      message,
      type: "success",
      route,
    });
  }
  /**
   * Send a warning notification
   * @param {string} username - Target username
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} route - Route to navigate when clicked
   */
  static warning(username, title, message, route = null) {
    pushNotificationService.sendToUser(username, {
      title,
      message,
      type: "warning",
      route,
    });
  }
  /**
   * Send an error notification
   * @param {string} username - Target username
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} route - Route to navigate when clicked
   */
  static error(username, title, message, route = null) {
    pushNotificationService.sendToUser(username, {
      title,
      message,
      type: "error",
      route,
    });
  }
  /**
   * Send a notification with external link
   * @param {string} username - Target username
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} link - External URL
   */
  static withLink(username, title, message, link) {
    pushNotificationService.sendToUser(username, {
      title,
      message,
      type: "info",
      link,
    });
  }
  /**
   * Send custom notification with all options
   * @param {string} username - Target username
   * @param {Object} options - Notification options
   */
  static custom(username, options) {
    pushNotificationService.sendToUser(username, options);
  }

  /**
   * Broadcast notification to all users
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @param {string} route - Route to navigate when clicked
   */
  static broadcast(title, message, type = "info", route = null) {
    pushNotificationService.broadcast({
      title,
      message,
      type,
      route,
    });
  }
  /**
   * Send notification to multiple users
   * @param {Array} usernames - Array of usernames
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @param {string} route - Route to navigate when clicked
   */
  static notifyMultiple(
    usernames,
    title,
    message,
    type = "info",
    route = null
  ) {
    pushNotificationService.sendToUsers(usernames, {
      title,
      message,
      type,
      route,
    });
  }

  // Predefined notification templates for common use cases
  /**
   * New message notification
   * @param {string} username - Target username
   * @param {string} senderName - Name of message sender
   */
  static newMessage(username, senderName) {
    this.notify(
      username,
      "New Message",
      `You have a new message from ${senderName}`,
      "/messages"
    );
  }

  /**
   * Booking confirmation notification
   * @param {string} username - Target username
   * @param {string} bookingDetails - Booking details
   */
  static bookingConfirmed(username, bookingDetails) {
    this.success(
      username,
      "Booking Confirmed",
      `Your booking has been confirmed: ${bookingDetails}`,
      "/bookings"
    );
  }

  /**
   * Match reminder notification
   * @param {string} username - Target username
   * @param {string} matchTime - Match time
   */
  static matchReminder(username, matchTime) {
    this.warning(
      username,
      "Match Reminder",
      `Your match starts in 30 minutes at ${matchTime}`,
      "/matches"
    );
  }

  /**
   * Friend request notification
   * @param {string} username - Target username
   * @param {string} requesterName - Name of person sending request
   */
  static friendRequest(username, requesterName) {
    this.notify(
      username,
      "Friend Request",
      `${requesterName} sent you a friend request`,
      "/friends"
    );
  }

  /**
   * Event invitation notification
   * @param {string} username - Target username
   * @param {string} eventName - Name of the event
   * @param {string} eventId - Event ID for routing
   */
  static eventInvitation(username, eventName, eventId) {
    this.notify(
      username,
      "Event Invitation",
      `You've been invited to ${eventName}`,
      `/events/${eventId}`
    );
  }

  /**
   * Liga update notification
   * @param {Array} usernames - Array of usernames in the liga
   * @param {string} updateMessage - Update message
   */
  static ligaUpdate(usernames, updateMessage) {
    this.notifyMultiple(
      usernames,
      "Liga Update",
      updateMessage,
      "info",
      "/liga"
    );
  }
}

module.exports = NotificationHelper;
