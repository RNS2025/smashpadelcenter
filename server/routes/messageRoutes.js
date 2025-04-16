const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Friend = require("../models/Friend");
const User = require("../models/user");
const user = require("../config/roles");

/**
 * Middleware to inject io
 */
router.use((req, res, next) => {
  req.io = req.app.get("socketio");
  next();
});

/**
 * @swagger
 * /api/v1/messages/{friendId}:
 *   get:
 *     summary: Get messages with a friend
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: ID of the user to fetch messages for (admin only)
 *     responses:
 *       200:
 *         description: List of messages
 *       400:
 *         description: Not friends or invalid user
 *       500:
 *         description: Server error
 */
router.get("/:friendId", user.can("access protected"), async (req, res) => {
  try {
    const { friendId } = req.params;
    let userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    if (isAdmin && req.query.userId) {
      const requestedUser = await User.findById(req.query.userId);
      if (!requestedUser) {
        return res.status(400).json({ error: "Bruger ikke fundet." });
      }
      userId = requestedUser._id;
    }

    const friendship = await Friend.findOne({
      $or: [
        { userId, friendId, status: "accepted" },
        { userId: friendId, friendId: userId, status: "accepted" },
      ],
    });

    if (!friendship && !isAdmin) {
      return res
        .status(400)
        .json({ error: "I er ikke venner med denne bruger." });
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("senderId receiverId", "username");

    // Mark messages as read for the user
    await Message.updateMany(
      { receiverId: userId, senderId: friendId, isRead: false },
      { isRead: true }
    );

    // Emit read status to the sender
    messages
      .filter((msg) => msg.receiverId.toString() === userId && msg.isRead)
      .forEach((msg) => {
        req.io.to(msg.senderId.toString()).emit("messageRead", {
          messageId: msg._id,
          friendId: userId,
        });
      });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Fejl ved hentning af beskeder:", error);
    res.status(500).json({ error: "Serverfejl." });
  }
});

/**
 * @swagger
 * /api/v1/messages:
 *   post:
 *     summary: Send a message to a friend
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *       400:
 *         description: Not friends or invalid input
 *       500:
 *         description: Server error
 */
router.post("/", user.can("access protected"), async (req, res) => {
  try {
    const { friendId, content } = req.body;
    const userId = req.user.id;

    if (!content.trim()) {
      return res
        .status(400)
        .json({ error: "Beskedindhold må ikke være tomt." });
    }

    const friendship = await Friend.findOne({
      $or: [
        { userId, friendId, status: "accepted" },
        { userId: friendId, friendId: userId, status: "accepted" },
      ],
    });

    if (!friendship) {
      return res
        .status(400)
        .json({ error: "I er ikke venner med denne bruger." });
    }

    const message = await Message.create({
      senderId: userId,
      receiverId: friendId,
      content,
      isRead: false,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "username")
      .populate("receiverId", "username");

    // Emit real-time message to both users
    req.io.to(userId).to(friendId).emit("newMessage", populatedMessage);

    res.status(201).json({ message: "Besked sendt.", data: populatedMessage });
  } catch (error) {
    console.error("Fejl ved afsendelse af besked:", error);
    res.status(500).json({ error: "Serverfejl." });
  }
});

module.exports = router;
