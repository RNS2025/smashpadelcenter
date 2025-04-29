// routes/privateEventRoutes.js
const express = require("express");
const router = express.Router();
const privateEventService = require("../Services/privateEventService");
const PrivateEvent = require("../models/PrivateEvent");
const logger = require("../config/logger"); // Import logger

// Middleware to detect if the request is from a browser
const isBrowser = (req) => {
  const userAgent = req.headers["user-agent"] || "";
  return /Mozilla|Chrome|Safari|Edge|Firefox/i.test(userAgent);
};

// POST /api/v1/private-event/:eventId/invite - Invite players to a private event
router.post("/:eventId/invite", async (req, res) => {
  try {
    const { usernames } = req.body;
    const event = await PrivateEvent.findById(req.params.eventId);
    if (!event) {
      logger.warn("Attempted to invite players to non-existent event", {
        eventId: req.params.eventId,
      });
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.username !== req.user.username) {
      logger.warn("Unauthorized invite attempt", {
        eventId: req.params.eventId,
        eventCreator: event.username,
        attemptedBy: req.user.username,
      });
      return res
        .status(403)
        .json({ message: "Only the event creator can invite players" });
    }
    const updatedEvent = await privateEventService.invitedPlayers(
      req.params.eventId,
      usernames
    );
    const io = req.app.get("socketio");
    io.to(req.params.eventId).emit("eventUpdated", updatedEvent);
    logger.info("Players invited to private event", {
      eventId: req.params.eventId,
      usernames,
    });
    res.json(updatedEvent);
  } catch (error) {
    logger.error("Error inviting players to private event", {
      eventId: req.params.eventId,
      usernames: req.body.usernames,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/private-event/:eventId/remove-player - Remove a player from a private event
router.post("/:eventId/remove-player", async (req, res) => {
  try {
    const { username } = req.body;
    const event = await PrivateEvent.findById(req.params.eventId);
    if (!event) {
      logger.warn("Attempted to remove player from non-existent event", {
        eventId: req.params.eventId,
      });
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.username !== req.user.username) {
      logger.warn("Unauthorized remove player attempt", {
        eventId: req.params.eventId,
        eventCreator: event.username,
        attemptedBy: req.user.username,
      });
      return res
        .status(403)
        .json({ message: "Only the event creator can remove players" });
    }
    const updatedEvent = await privateEventService.removePlayerFromEvent(
      req.params.eventId,
      username
    );
    const io = req.app.get("socketio");
    io.to(req.params.eventId).emit("eventUpdated", updatedEvent);
    logger.info("Player removed from private event", {
      eventId: req.params.eventId,
      username,
    });
    res.json(updatedEvent);
  } catch (error) {
    logger.error("Error removing player from private event", {
      eventId: req.params.eventId,
      username: req.body.username,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/private-event/:eventId/confirm - Confirm acceptance of a private event
router.post("/:eventId/confirm", async (req, res) => {
  try {
    const { username } = req.body;
    const updatedEvent = await privateEventService.confirmAcceptPrivateEvent(
      req.params.eventId,
      username
    );
    const io = req.app.get("socketio");
    io.to(req.params.eventId).emit("eventUpdated", updatedEvent);
    logger.info("User confirmed acceptance of private event", {
      eventId: req.params.eventId,
      username,
    });
    res.json(updatedEvent);
  } catch (error) {
    logger.error("Error confirming acceptance of private event", {
      eventId: req.params.eventId,
      username: req.body.username,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/private-event/:eventId/decline - Decline a private event
router.post("/:eventId/decline", async (req, res) => {
  try {
    const { username } = req.body;
    const event = await PrivateEvent.findById(req.params.eventId);
    if (!event) {
      logger.warn("Attempted to decline non-existent event", {
        eventId: req.params.eventId,
      });
      return res.status(404).json({ message: "Event not found" });
    }

    // Allow either the event owner or the invited user to decline
    if (
      username !== req.user.username &&
      event.username !== req.user.username
    ) {
      logger.warn("User attempted to decline without proper permissions", {
        eventId: req.params.eventId,
        actualUser: req.user.username,
        attemptedAs: username,
        eventOwner: event.username,
      });
      return res.status(403).json({
        message:
          "Only the invited user or event owner can decline this invitation",
      });
    }
    const updatedEvent = await privateEventService.confirmDeclinePrivateEvent(
      req.params.eventId,
      username
    );
    const io = req.app.get("socketio");
    io.to(req.params.eventId).emit("eventUpdated", updatedEvent);
    logger.info("User declined private event", {
      eventId: req.params.eventId,
      username,
    });
    res.json(updatedEvent);
  } catch (error) {
    logger.error("Error declining private event", {
      eventId: req.params.eventId,
      username: req.body.username,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// GET /api/v1/private-event - Get all private events
router.get("/", async (req, res) => {
  try {
    const events = await privateEventService.getAllPrivateEvents();
    // Filter out events with openRegistration: false for non-authenticated users
    const filteredEvents = req.isAuthenticated()
      ? events
      : events.filter((event) => event.openRegistration);
    logger.info("Successfully fetched private events");
    res.json(filteredEvents);
  } catch (error) {
    logger.error("Error fetching private events", { error: error.message });
    res.status(500).json({ message: error.message });
  }
});

// GET /api/v1/private-event/:username - Get private events for a user
router.get("/:username", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.username !== req.params.username) {
      logger.warn("Unauthorized access attempt to user events", {
        requestedUsername: req.params.username,
        authenticated: req.isAuthenticated(),
        user: req.isAuthenticated() ? req.user.username : null,
      });
      return res.status(403).json({ message: "Access denied" });
    }
    const events = await privateEventService.getPrivateEventsByUser(
      req.params.username
    );
    logger.info("Successfully fetched user private events", {
      username: req.params.username,
    });
    res.json(events);
  } catch (error) {
    logger.error("Error fetching user private events", {
      username: req.params.username,
      error: error.message,
    });
    res.status(404).json({ message: error.message });
  }
});

// GET /api/v1/private-event/:username/:eventId
router.get("/event/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await privateEventService.getPrivateEventById(eventId);
    if (!event) {
      logger.warn("Event not found", { eventId });
      return res.status(404).json({ message: "Event not found" });
    }
    logger.info("Successfully fetched private event", { eventId });
    res.json(event);
  } catch (error) {
    logger.error("Error fetching private event", {
      eventId: req.params.eventId,
      error: error.message,
    });
    res.status(404).json({ message: error.message });
  }
});

// POST /api/v1/private-event - Create a new private event
router.post("/", async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      username: req.user.username,
    };
    const newEvent = await privateEventService.createPrivateEvent(eventData);
    const io = req.app.get("socketio");
    io.to(newEvent.id).emit("eventUpdated", newEvent);
    logger.info("Private event created successfully", {
      eventId: newEvent._id,
      creator: req.user.username,
    });
    res.status(201).json(newEvent);
  } catch (error) {
    logger.error("Error creating private event", {
      username: req.isAuthenticated() ? req.user.username : null,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// PATCH /api/v1/private-event/:eventId - Update a private event
router.patch("/:eventId", async (req, res) => {
  try {
    const event = await PrivateEvent.findById(req.params.eventId);
    if (!event) {
      logger.warn("Attempted to update non-existent event", {
        eventId: req.params.eventId,
      });
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.username !== req.user.username) {
      logger.warn("Unauthorized update attempt", {
        eventId: req.params.eventId,
        eventCreator: event.username,
        attemptedBy: req.user.username,
      });
      return res
        .status(403)
        .json({ message: "Only the event creator can update the event" });
    }
    const updatedEvent = await privateEventService.updatePrivateEvent(
      req.params.eventId,
      req.body
    );
    const io = req.app.get("socketio");
    io.to(req.params.eventId).emit("eventUpdated", updatedEvent);
    logger.info("Private event updated successfully", {
      eventId: req.params.eventId,
      username: req.user.username,
    });
    res.json(updatedEvent);
  } catch (error) {
    logger.error("Error updating private event", {
      eventId: req.params.eventId,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/private-event/:eventId/join - Join a private event
router.post("/:eventId/join", async (req, res) => {
  try {
    const { username } = req.body;
    if (username !== req.user.username) {
      logger.warn("User attempted to join as another user", {
        eventId: req.params.eventId,
        actualUser: req.user.username,
        attemptedAs: username,
      });
      return res
        .status(403)
        .json({ message: "Cannot join event as another user" });
    }
    const event = await privateEventService.joinPrivateEvent(
      req.params.eventId,
      username
    );
    const io = req.app.get("socketio");
    io.to(req.params.eventId).emit("eventUpdated", event);
    logger.info("User joined private event", {
      eventId: req.params.eventId,
      username,
    });
    res.json(event);
  } catch (error) {
    logger.error("Error joining private event", {
      eventId: req.params.eventId,
      username: req.body.username,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/private-event/:eventId/confirm - Confirm a join request
router.post("/:eventId/confirm", async (req, res) => {
  try {
    const { username } = req.body;
    const event = await PrivateEvent.findById(req.params.eventId);
    if (!event) {
      logger.warn("Attempted to confirm join for non-existent event", {
        eventId: req.params.eventId,
      });
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.username !== req.user.username) {
      logger.warn("Unauthorized confirm attempt", {
        eventId: req.params.eventId,
        eventCreator: event.username,
        attemptedBy: req.user.username,
      });
      return res
        .status(403)
        .json({ message: "Only the event creator can confirm joins" });
    }
    const updatedEvent = await privateEventService.joinPrivateEvent(
      req.params.eventId,
      username
    );
    const io = req.app.get("socketio");
    io.to(req.params.eventId).emit("eventUpdated", updatedEvent);
    logger.info("Join request confirmed", {
      eventId: req.params.eventId,
      confirmedUser: username,
    });
    res.json(updatedEvent);
  } catch (error) {
    logger.error("Error confirming join request", {
      eventId: req.params.eventId,
      username: req.body.username,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/v1/private-event/:eventId - Delete a private event
router.delete("/:eventId", async (req, res) => {
  try {
    const event = await PrivateEvent.findById(req.params.eventId);
    if (!event) {
      logger.warn("Attempted to delete non-existent event", {
        eventId: req.params.eventId,
      });
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.username !== req.user.username) {
      logger.warn("Unauthorized delete attempt", {
        eventId: req.params.eventId,
        eventCreator: event.username,
        attemptedBy: req.user.username,
      });
      return res
        .status(403)
        .json({ message: "Only the event creator can delete the event" });
    }
    const events = await privateEventService.deletePrivateEvent(
      req.params.eventId
    );
    const io = req.app.get("socketio");
    io.to(req.params.eventId).emit("eventDeleted", req.params.eventId);
    logger.info("Private event deleted successfully", {
      eventId: req.params.eventId,
      username: req.user.username,
    });
    res.json(events);
  } catch (error) {
    logger.error("Error deleting private event", {
      eventId: req.params.eventId,
      error: error.message,
    });
    res.status(404).json({ message: error.message });
  }
});

module.exports = router;
