// routes/privateEventRoutes.js
const express = require("express");
const router = express.Router();
const privateEventService = require("../Services/privateEventService");
const PrivateEvent = require("../models/PrivateEvent");

// Middleware to detect if the request is from a browser
const isBrowser = (req) => {
  const userAgent = req.headers["user-agent"] || "";
  return /Mozilla|Chrome|Safari|Edge|Firefox/i.test(userAgent);
};

// GET /api/v1/private-event - Get all private events
router.get("/", async (req, res) => {
  try {
    const events = await privateEventService.getAllPrivateEvents();
    // Filter out events with openRegistration: false for non-authenticated users
    const filteredEvents = req.isAuthenticated()
      ? events
      : events.filter((event) => event.openRegistration);
    res.json(filteredEvents);
  } catch (error) {
    console.error("Error fetching events:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/v1/private-event/:username - Get private events for a user
router.get("/:username", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.username !== req.params.username) {
      return res.status(403).json({ message: "Access denied" });
    }
    const events = await privateEventService.getPrivateEventsByUser(
      req.params.username
    );
    res.json(events);
  } catch (error) {
    console.error("Error fetching user events:", error.message);
    res.status(404).json({ message: error.message });
  }
});

// GET /api/v1/private-event/:username/:eventId
router.get("/:username/:eventId", async (req, res) => {
  try {
    const { username, eventId } = req.params;
    const event = await privateEventService.getPrivateEventById(username, eventId);
    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error.message);
    res.status(404).json({ message: error.message });
  }
});


// POST /api/v1/private-event - Create a new private event
router.post("/", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const eventData = {
      ...req.body,
      username: req.user.username,
    };
    const newEvent = await privateEventService.createPrivateEvent(eventData);
    const io = req.app.get("socketio");
    io.to(newEvent.id).emit("eventUpdated", newEvent);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// PATCH /api/v1/private-event/:eventId - Update a private event
router.patch("/:eventId", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const event = await PrivateEvent.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.username !== req.user.username) {
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
    res.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/private-event/:eventId/join - Join a private event
router.post("/:eventId/join", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { username } = req.body;
    if (username !== req.user.username) {
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
    res.json(event);
  } catch (error) {
    console.error("Error joining event:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/private-event/:eventId/confirm - Confirm a join request
router.post("/:eventId/confirm", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { username } = req.body;
    const event = await PrivateEvent.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.username !== req.user.username) {
      return res
        .status(403)
        .json({ message: "Only the event creator can confirm joins" });
    }
    const updatedEvent = await privateEventService.confirmJoinPrivateEvent(
      req.params.eventId,
      username
    );
    const io = req.app.get("socketio");
    io.to(req.params.eventId).emit("eventUpdated", updatedEvent);
    res.json(updatedEvent);
  } catch (error) {
    console.error("Error confirming join:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/v1/private-event/:eventId - Delete a private event
router.delete("/:eventId", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const event = await PrivateEvent.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.username !== req.user.username) {
      return res
        .status(403)
        .json({ message: "Only the event creator can delete the event" });
    }
    const events = await privateEventService.deletePrivateEvent(
      req.params.eventId
    );
    const io = req.app.get("socketio");
    io.to(req.params.eventId).emit("eventDeleted", req.params.eventId);
    res.json(events);
  } catch (error) {
    console.error("Error deleting event:", error.message);
    res.status(404).json({ message: error.message });
  }
});

module.exports = router;
