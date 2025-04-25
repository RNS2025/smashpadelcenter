const express = require("express");
const router = express.Router();
const padelMatchService = require("../Services/padelMatchService");
const PadelMatch = require("../models/PadelMatch");

// GET /api/v1/matches - Get all matches
router.get("/", async (req, res) => {
  try {
    const matches = await padelMatchService.getAllMatches();
    res.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/matches - Create a new match
router.post("/", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const matchData = {
      ...req.body,
      username: req.user.username, // Ensure creator is the authenticated user
    };
    const newMatch = await padelMatchService.createMatch(matchData);
    const io = req.app.get("socketio");
    console.log("Emitting matchUpdated for match:", newMatch.id);
    io.to(newMatch.id).emit("matchUpdated", newMatch);
    res.status(201).json(newMatch);
  } catch (error) {
    console.error("Error creating match:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/matches/:id/join - Join a match
router.post("/:id/join", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { username } = req.body;
    if (username !== req.user.username) {
      return res
        .status(403)
        .json({ message: "Cannot join match as another user" });
    }
    const match = await padelMatchService.joinMatch(req.params.id, username);
    const io = req.app.get("socketio");
    console.log("Emitting matchUpdated for match:", match.id);
    io.to(req.params.id).emit("matchUpdated", match);
    res.json(match);
  } catch (error) {
    console.error("joinMatch error:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/matches/:id/confirm - Confirm a join request
router.post("/:id/confirm", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { username } = req.body;
    const match = await padelMatchService.getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    if (match.username !== req.user.username) {
      return res
        .status(403)
        .json({ message: "Only the match creator can confirm joins" });
    }
    const updatedMatch = await padelMatchService.confirmJoin(
      req.params.id,
      username
    );
    const io = req.app.get("socketio");
    console.log("Emitting matchUpdated for match:", updatedMatch.id);
    io.to(req.params.id).emit("matchUpdated", updatedMatch);
    res.json(updatedMatch);
  } catch (error) {
    console.error("confirmJoin error:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// PATCH /api/v1/matches/:id/reserve - Reserve or unreserve a spot
router.patch("/:id/reserve", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { spotIndex, reserve } = req.body;
    const match = await PadelMatch.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    if (match.username !== req.user.username) {
      return res
        .status(403)
        .json({ message: "Only the match creator can reserve spots" });
    }
    const matches = await padelMatchService.reserveSpots(
      req.params.id,
      spotIndex,
      reserve
    );
    const io = req.app.get("socketio");
    console.log("Emitting matchUpdated for match:", req.params.id);
    io.to(req.params.id).emit(
      "matchUpdated",
      matches.find((m) => m.id === req.params.id)
    );
    res.json(matches);
  } catch (error) {
    console.error("Error reserving spots:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/v1/matches/:id - Delete a match
router.delete("/:id", async (req, res) => {
  try {
    const match = await padelMatchService.getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    const io = req.app.get("socketio");
    console.log("Emitting matchDeleted for match:", req.params.id);
    io.to(req.params.id).emit("matchDeleted", req.params.id);
    const matches = await padelMatchService.deleteMatch(req.params.id);
    res.json(matches);
  } catch (error) {
    console.error("Error deleting match:", error.message);
    res.status(404).json({ message: error.message });
  }
});

// GET /api/v1/matches/:id - Get a single match by ID
router.get("/:id", async (req, res) => {
  try {
    const match = await padelMatchService.getMatchById(req.params.id);
    res.json(match);
  } catch (error) {
    console.error("Error fetching match:", error.message);
    res.status(404).json({ message: error.message });
  }
});

// GET /api/v1/matches/player/:username - Get matches for a player by username
router.get("/player/:username", async (req, res) => {
  try {
    const username =
      req.params.username === "me" && req.isAuthenticated()
        ? req.user.username
        : req.params.username;
    const matches = await padelMatchService.getMatchesByPlayer(username);
    res.json(matches);
  } catch (error) {
    console.error("Error fetching player matches:", error.message);
    res.status(404).json({ message: error.message });
  }
});

module.exports = router;
