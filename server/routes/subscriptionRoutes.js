const express = require("express");
const {
  saveSubscription,
  sendNotification,
} = require("../Services/subscriptionService");
const SubscriptionPreference = require("../models/subscriptionPreferenceSchema");

const router = express.Router();

/**
 * @swagger
 * /api/v1/subscribe:
 *   post:
 *     summary: Save a subscription for push notifications
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscription:
 *                 type: object
 *                 description: The subscription object from the client
 *               userId:
 *                 type: string
 *                 description: The ID of the user associated with the subscription
 *     responses:
 *       201:
 *         description: Subscription saved successfully
 *       500:
 *         description: Failed to save subscription
 */
router.post("/subscribe", async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    await saveSubscription(subscription, userId);
    res.status(201).json({ message: "Subscription saved successfully." });
  } catch (error) {
    console.error("Error saving subscription:", error);
    res.status(500).json({ error: "Failed to save subscription." });
  }
});

/**
 * @swagger
 * /api/v1/notify:
 *   post:
 *     summary: Send a notification to a user or all users
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user to notify (null for all users)
 *               title:
 *                 type: string
 *                 description: The title of the notification
 *               body:
 *                 type: string
 *                 description: The body of the notification
 *               image:
 *                 type: string
 *                 description: Optional image URL for the notification
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       500:
 *         description: Failed to send notification
 */
router.post("/notify", async (req, res) => {
  try {
    const { userId, title, body, category } = req.body;
    await sendNotification(userId, title, body, category);
    res.status(200).json({ message: "Notification sent successfully." });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: "Failed to send notification." });
  }
});

// Get user preferences
router.get("/preferences/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await SubscriptionPreference.findOne({ userId });

    if (!preferences) {
      // Return default preferences if none exist
      return res.status(200).json({
        preferences: {
          updates: true,
          messages: true,
          events: false,
          promotions: false,
        },
      });
    }

    res.status(200).json({ preferences: preferences.preferences });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch notification preferences." });
  }
});

// Save user preferences
router.post("/preferences", async (req, res) => {
  try {
    const { userId, preferences } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Use upsert to create if doesn't exist or update if it does
    await SubscriptionPreference.findOneAndUpdate(
      { userId },
      { userId, preferences, updatedAt: Date.now() },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Preferences saved successfully" });
  } catch (error) {
    console.error("Error saving notification preferences:", error);
    res.status(500).json({ error: "Failed to save notification preferences." });
  }
});

module.exports = router;
