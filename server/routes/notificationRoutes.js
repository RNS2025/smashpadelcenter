// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const pushNotificationService = require("../Services/pushNotificationService");
const { verifyJWT, verifyJWTForSSE } = require("../middleware/jwt");
const logger = require("../config/logger");

// Special OPTIONS handler for subscribe endpoint to prevent redirect issues
router.options("/subscribe", (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Cache-Control"
    );
    res.header("Access-Control-Allow-Credentials", "true");
  }
  return res.status(200).end();
});

// Special OPTIONS handler for send endpoint
router.options("/send", (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Cache-Control"
    );
    res.header("Access-Control-Allow-Credentials", "true");
  }
  return res.status(200).end();
});

// Special OPTIONS handler for test endpoint
router.options("/test", (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Cache-Control"
    );
    res.header("Access-Control-Allow-Credentials", "true");
  }
  return res.status(200).end();
});

// Special OPTIONS handler for test-match endpoint
router.options("/test-match", (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Cache-Control"
    );
    res.header("Access-Control-Allow-Credentials", "true");
  }
  return res.status(200).end();
});

// Special OPTIONS handler for status endpoint
router.options("/status", (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Cache-Control"
    );
    res.header("Access-Control-Allow-Credentials", "true");
  }
  return res.status(200).end();
});

router.get("/subscribe", async (req, res) => {
  try {
    // Set specific headers for SSE connection to handle CORS
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Important for NGINX

    // Handle CORS for SSE specifically
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    // Get token from query params or headers
    const token =
      req.query.token ||
      (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization);

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify the token
    const jwt = require("jsonwebtoken");
    const User = require("../models/user");

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret"
      );
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const username = user.username;

      if (!username) {
        return res.status(400).json({ error: "Username not found" });
      }

      // Add user to notification service
      pushNotificationService.addSubscriber(username, res);
    } catch (err) {
      console.error("JWT verification error:", err.message);
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("Error in subscribe endpoint:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/send", verifyJWT, (req, res) => {
  try {
    // Set CORS headers specifically for this endpoint to prevent redirects
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    }

    const { username, usernames, title, message, type, link, route, data } =
      req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: "Title and message are required",
      });
    }

    const notification = {
      title,
      message,
      type: type || "info",
      link,
      route,
      data,
    };

    if (username) {
      // Send to specific user
      pushNotificationService.sendToUser(username, notification);
      res.json({
        success: true,
        message: `Notification sent to user ${username}`,
      });
    } else if (usernames && Array.isArray(usernames)) {
      // Send to multiple users
      pushNotificationService.sendToUsers(usernames, notification);
      res.json({
        success: true,
        message: `Notification sent to ${usernames.length} users`,
      });
    } else {
      // Broadcast to all users
      pushNotificationService.broadcast(notification);
      res.json({
        success: true,
        message: "Notification broadcasted to all users",
      });
    }
  } catch (error) {
    logger.error("Error sending notification:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

router.get("/status", verifyJWT, (req, res) => {
  const username = req.user.username;

  res.json({
    activeSubscribers: pushNotificationService.getActiveSubscribersCount(),
    isUserOnline: pushNotificationService.isUserOnline(username),
  });
});

router.post("/test", verifyJWT, (req, res) => {
  const username = req.user.username;

  const testNotification = {
    title: "Test Notification",
    message: "This is a test notification from your app!",
    type: "info",
    route: "/dashboard",
    data: { test: true },
  };

  pushNotificationService.sendToUser(username, testNotification);

  res.json({
    success: true,
    message: "Test notification sent",
  });
});

router.get("/vapid-public-key", (req, res) => {
  res.json({
    publicKey: pushNotificationService.getVapidPublicKey(),
  });
});

router.post("/subscribe-push", verifyJWT, (req, res) => {
  try {
    const { subscription } = req.body;
    const username = req.user.username;

    if (!subscription) {
      return res.status(400).json({ error: "Subscription data is required" });
    }

    pushNotificationService.addPushSubscription(username, subscription);

    res.json({
      success: true,
      message: "Successfully subscribed to push notifications",
    });
  } catch (error) {
    logger.error("Error subscribing to push notifications:", error);
    res
      .status(500)
      .json({ error: "Failed to subscribe to push notifications" });
  }
});

router.post("/unsubscribe-push", verifyJWT, (req, res) => {
  try {
    const username = req.user.username;

    pushNotificationService.removePushSubscription(username);

    res.json({
      success: true,
      message: "Successfully unsubscribed from push notifications",
    });
  } catch (error) {
    logger.error("Error unsubscribing from push notifications:", error);
    res
      .status(500)
      .json({ error: "Failed to unsubscribe from push notifications" });
  }
});

module.exports = router;
