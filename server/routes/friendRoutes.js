const express = require("express");
const router = express.Router();
const Friend = require("../models/Friend");
const User = require("../models/user");
const NotificationHistory = require("../models/NotificationHistory");
const { verifyJWT, checkRole } = require("../middleware/jwt");
const logger = require("../config/logger"); // Import logger

/**
 * @swagger
 * /api/v1/friends/add:
 *   post:
 *     summary: Send a friend request
 *     tags: [Friends]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       201:
 *         description: Friend request sent
 *       400:
 *         description: Invalid username or user already added
 *       500:
 *         description: Server error
 */
router.post(
  "/add",
  verifyJWT,
  checkRole(["user", "admin", "trainer"]),
  async (req, res) => {
    logger.debug("Processing friend request", { username: req.body.username });
    try {
      const { username } = req.body;
      const user = await User.findById(req.user.id);
      const friend = await User.findOne({ username });

      if (!friend) {
        logger.info("Friend request failed - user not found", { username });
        return res.status(400).json({ error: "Bruger ikke fundet." });
      }
      if (friend._id.equals(user._id)) {
        logger.info("Friend request failed - user tried to add themselves", {
          userId: user._id,
        });
        return res
          .status(400)
          .json({ error: "Du kan ikke tilføje dig selv som ven." });
      }

      const existingRequest = await Friend.findOne({
        $or: [
          { userId: user._id, friendId: friend._id },
          { userId: friend._id, friendId: user._id },
        ],
      });
      if (existingRequest) {
        logger.info("Friend request failed - request already exists", {
          userId: user._id,
          friendId: friend._id,
        });
        return res.status(400).json({
          error:
            "Venanmodning eksisterer allerede eller brugeren er allerede en ven.",
        });
      }

      await Friend.create({
        userId: user._id,
        friendId: friend._id,
        status: "pending",
      });

      // Notify the friend
      await NotificationHistory.create({
        userId: friend._id.toString(),
        notificationId: require("uuid").v4(),
        title: "Ny venanmodning",
        body: `${user.username} har sendt dig en venanmodning.`,
        category: "friends",
      });

      logger.info("Friend request sent successfully", {
        from: user.username,
        to: friend.username,
      });
      res.status(201).json({ message: "Venanmodning sendt." });
    } catch (error) {
      logger.error("Error sending friend request", { error: error.message });
      res.status(500).json({ error: "Serverfejl." });
    }
  }
);

/**
 * @swagger
 * /api/v1/friends/respond:
 *   post:
 *     summary: Respond to a friend request
 *     tags: [Friends]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *     responses:
 *       200:
 *         description: Friend request updated
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post(
  "/respond",
  verifyJWT,
  checkRole(["user", "admin", "trainer"]),
  async (req, res) => {
    logger.debug("Processing friend request response", {
      friendId: req.body.friendId,
      status: req.body.status,
    });
    try {
      const { friendId, status } = req.body;
      const userId = req.user.id;

      const friendRequest = await Friend.findOne({
        userId: friendId,
        friendId: userId,
        status: "pending",
      });

      if (!friendRequest) {
        logger.info("Friend request response failed - request not found", {
          friendId,
          userId,
        });
        return res.status(400).json({ error: "Venanmodning ikke fundet." });
      }

      friendRequest.status = status;
      await friendRequest.save();

      if (status === "accepted") {
        // Create mutual friend relationship
        await Friend.create({ userId, friendId, status: "accepted" });
        // Notify the requester
        await NotificationHistory.create({
          userId: friendId.toString(),
          notificationId: require("uuid").v4(),
          title: "Venanmodning accepteret",
          body: `${req.user.username} har accepteret din venanmodning.`,
          category: "friends",
        });
        logger.info("Friend request accepted", {
          by: req.user.username,
          friendId,
        });
      } else {
        logger.info("Friend request rejected", {
          by: req.user.username,
          friendId,
        });
      }

      res.status(200).json({ message: `Venanmodning ${status}.` });
    } catch (error) {
      logger.error("Error responding to friend request", {
        error: error.message,
      });
      res.status(500).json({ error: "Serverfejl." });
    }
  }
);

/**
 * @swagger
 * /api/v1/friends:
 *   get:
 *     summary: Get user's friends and pending requests
 *     tags: [Friends]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: ID of the user to fetch friends for (admin only)
 *     responses:
 *       200:
 *         description: List of friends and pending requests
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  verifyJWT,
  checkRole(["user", "admin", "trainer"]),
  async (req, res) => {
    logger.debug("Fetching friends list", {
      userId: req.user.id,
      requestedUserId: req.query.userId,
    });
    try {
      let targetUserId = req.user.id;
      const isAdmin = req.user.role === "admin";

      // Allow admins to specify a userId
      if (isAdmin && req.query.userId) {
        const requestedUser = await User.findById(req.query.userId);
        if (!requestedUser) {
          logger.info("Friends list request failed - user not found", {
            requestedUserId: req.query.userId,
          });
          return res.status(400).json({ error: "Bruger ikke fundet." });
        }
        targetUserId = requestedUser._id;
      }

      const friends = await Friend.find({
        $or: [{ userId: targetUserId }, { friendId: targetUserId }],
        status: "accepted",
      }).populate("userId friendId", "username");

      const pendingRequests = await Friend.find({
        friendId: targetUserId,
        status: "pending",
      }).populate("userId", "username");

      logger.info("Friends list retrieved successfully", {
        userId: req.user.id,
        targetUserId,
        friendsCount: friends.length,
        pendingCount: pendingRequests.length,
      });
      res.status(200).json({ friends, pendingRequests });
    } catch (error) {
      logger.error("Error fetching friends list", { error: error.message });
      res.status(500).json({ error: "Serverfejl." });
    }
  }
);

module.exports = router;
