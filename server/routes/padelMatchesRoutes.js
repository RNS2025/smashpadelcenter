const express = require("express");
const router = express.Router();
const padelMatchService = require("../Services/padelMatchService");
const PadelMatch = require("../models/PadelMatch");
const logger = require("../config/logger");
const { verifyJWT } = require("../middleware/jwt");
router.use(verifyJWT);

// GET /api/v1/matches - Get all matches
router.get("/", async (req, res) => {
  try {
    const matches = await padelMatchService.getAllMatches();
    logger.info("Successfully fetched all padel matches");
    res.json(matches);
  } catch (error) {
    logger.error("Error fetching matches", { error: error.message });
    res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/matches/:id/reject - Reject a join request
router.post("/:id/reject", async (req, res) => {
  try {
    const { username } = req.body;
    const match = await PadelMatch.findById(req.params.id);
    if (!match) {
      logger.warn("Attempted to reject join for non-existent match", {
        matchId: req.params.id,
      });
      return res.status(404).json({ message: "Match not found" });
    }

    const updatedMatch = await padelMatchService.rejectJoin(
      req.params.id,
      username
    );
    const io = req.app.get("socketio");
    logger.info("Emitting matchUpdated event", { matchId: updatedMatch.id });
    io.to(req.params.id).emit("matchUpdated", updatedMatch);

    logger.info("Successfully rejected user join", {
      matchId: req.params.id,
      username,
    });
    res.json(updatedMatch);
  } catch (error) {
    logger.error("Error rejecting join", {
      matchId: req.params.id,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/matches/:id/accept - Accept a join request
router.post("/:id/accept", async (req, res) => {
  try {
    const { username } = req.body;
    const match = await PadelMatch.findById(req.params.id);
    if (!match) {
      logger.warn("Attempted to accept join for non-existent match", {
        matchId: req.params.id,
      });
      return res.status(404).json({ message: "Match not found" });
    }
    // Check if user is invited to the match
    if (!match.invitedPlayers.includes(username)) {
      logger.warn("User not invited to match", {
        matchId: req.params.id,
        username,
      });
      return res.status(403).json({ message: "User not invited to match" });
    }

    const updatedMatch = await padelMatchService.acceptJoin(
      req.params.id,
      username
    );
    const io = req.app.get("socketio");
    logger.info("Emitting matchUpdated event", { matchId: updatedMatch.id });
    io.to(req.params.id).emit("matchUpdated", updatedMatch);

    logger.info("Successfully accepted user join", {
      matchId: req.params.id,
      username,
    });
    res.json(updatedMatch);
  } catch (error) {
    logger.error("Error accepting join", {
      matchId: req.params.id,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/matches/:id/invite - Invite players to a match
router.post("/:id/invite", async (req, res) => {
  try {
    const { usernames } = req.body;
    const match = await PadelMatch.findById(req.params.id);
    if (!match) {
      logger.warn("Attempted to invite players to non-existent match", {
        matchId: req.params.id,
      });
      return res.status(404).json({ message: "Match not found" });
    }
    if (match.username !== req.user.username) {
      logger.warn("Unauthorized invite attempt", {
        matchId: req.params.id,
        matchCreator: match.username,
        attemptedBy: req.user.username,
      });
      return res
        .status(403)
        .json({ message: "Only the match creator can invite players" });
    }
    const updatedMatch = await padelMatchService.invitedPlayers(
      req.params.id,
      usernames
    );
    const io = req.app.get("socketio");
    logger.info("Emitting matchUpdated event", { matchId: updatedMatch.id });
    io.to(req.params.id).emit("matchUpdated", updatedMatch);
    logger.info("Players invited to padel match", {
      matchId: req.params.id,
      usernames,
    });
    res.json(updatedMatch);
  } catch (error) {
    logger.error("Error inviting players to padel match", {
      matchId: req.params.id,
      usernames: req.body.usernames,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/matches - Create a new match
router.post("/", async (req, res) => {
  try {
    const matchData = {
      ...req.body,
      username: req.user.username, // Ensure creator is the authenticated user
    };
    const newMatch = await padelMatchService.createMatch(matchData);
    const io = req.app.get("socketio");
    logger.info("Emitting matchUpdated event", { matchId: newMatch.id });
    io.to(newMatch.id).emit("matchUpdated", newMatch);

    logger.info("Successfully created new padel match", {
      matchId: newMatch.id,
    });
    res.status(201).json(newMatch);
  } catch (error) {
    logger.error("Error creating match", { error: error.message });
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/matches/:id/join - Join a match
router.post("/:id/join", async (req, res) => {
  try {
    const { username } = req.body;
    if (username !== req.user.username) {
      logger.warn("User attempted to join match as another user", {
        requestedUsername: username,
        actualUsername: req.user.username,
      });
      return res
        .status(403)
        .json({ message: "Cannot join match as another user" });
    }
    const match = await padelMatchService.joinMatch(req.params.id, username);
    const io = req.app.get("socketio");
    logger.info("Emitting matchUpdated event", { matchId: match.id });
    io.to(req.params.id).emit("matchUpdated", match);

    logger.info("User successfully joined match", {
      username,
      matchId: req.params.id,
    });
    res.json(match);
  } catch (error) {
    logger.error("Error joining match", {
      matchId: req.params.id,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/matches/:id/player-cancel - Cancel a join request
router.post("/:id/player-cancel", async (req, res) => {
  try {
    const { username } = req.body;
    const match = await padelMatchService.getMatchById(req.params.id);
    if (!match) {
      logger.warn("Attempted to cancel join for non-existent match", {
        matchId: req.params.id,
      });
      return res.status(404).json({ message: "Match not found" });
    }
    if (match.username === req.user.username) {
      logger.warn("Match creator attempted to cancel their own join request", {
        matchId: req.params.id,
        username,
      });
      return res
        .status(403)
        .json({ message: "Match creator cannot cancel their own join" });
    }
    const updatedMatch = await padelMatchService.playerCancelJoinMatch(
      req.params.id,
      username
    );
    const io = req.app.get("socketio");
    logger.info("Emitting matchUpdated event", { matchId: updatedMatch.id });
    io.to(req.params.id).emit("matchUpdated", updatedMatch);

    logger.info("Successfully cancelled user join", {
      matchId: req.params.id,
      username,
    });
    res.json(updatedMatch);
  } catch (error) {
    logger.error("Error cancelling join", {
      matchId: req.params.id,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/matches/:id/confirm - Confirm a join request
router.post("/:id/confirm", async (req, res) => {
  try {
    const { username } = req.body;
    const match = await padelMatchService.getMatchById(req.params.id);
    if (!match) {
      logger.warn("Attempted to confirm join for non-existent match", {
        matchId: req.params.id,
      });
      return res.status(404).json({ message: "Match not found" });
    }
    if (match.username !== req.user.username) {
      logger.warn("Non-creator attempted to confirm join", {
        matchId: req.params.id,
        requestUser: req.user.username,
        matchCreator: match.username,
      });
      return res
        .status(403)
        .json({ message: "Only the match creator can confirm joins" });
    }
    const updatedMatch = await padelMatchService.confirmJoin(
      req.params.id,
      username
    );
    const io = req.app.get("socketio");
    logger.info("Emitting matchUpdated event", { matchId: updatedMatch.id });
    io.to(req.params.id).emit("matchUpdated", updatedMatch);

    logger.info("Successfully confirmed user join", {
      matchId: req.params.id,
      username,
    });
    res.json(updatedMatch);
  } catch (error) {
    logger.error("Error confirming join", {
      matchId: req.params.id,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// PATCH /api/v1/matches/:id/reserve - Reserve or unreserve a spot
router.patch("/:id/reserve", async (req, res) => {
  try {
    const { spotIndex, reserve } = req.body;
    const match = await PadelMatch.findById(req.params.id);
    if (!match) {
      logger.warn("Attempted to reserve spot for non-existent match", {
        matchId: req.params.id,
      });
      return res.status(404).json({ message: "Match not found" });
    }
    if (match.username !== req.user.username) {
      logger.warn("Non-creator attempted to reserve spot", {
        matchId: req.params.id,
        requestUser: req.user.username,
        matchCreator: match.username,
      });
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
    logger.info("Emitting matchUpdated event", { matchId: req.params.id });
    io.to(req.params.id).emit(
      "matchUpdated",
      matches.find((m) => m.id === req.params.id)
    );

    logger.info(`Successfully ${reserve ? "reserved" : "unreserved"} spot`, {
      matchId: req.params.id,
      spotIndex,
    });
    res.json(matches);
  } catch (error) {
    logger.error("Error reserving spots", {
      matchId: req.params.id,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// Remove player from match
router.post("/:id/remove-player", async (req, res) => {
  try {
    const { username } = req.body;
    const match = await padelMatchService.getMatchById(req.params.id);
    if (!match) {
      logger.warn("Attempted to remove player from non-existent match", {
        matchId: req.params.id,
      });
      return res.status(404).json({ message: "Match not found" });
    }
    if (match.username !== req.user.username) {
      logger.warn("Non-creator attempted to remove player", {
        matchId: req.params.id,
        requestUser: req.user.username,
        matchCreator: match.username,
      });
      return res
        .status(403)
        .json({ message: "Only the match creator can remove players" });
    }
    const updatedMatch = await padelMatchService.removePlayer(
      req.params.id,
      username
    );
    const io = req.app.get("socketio");
    logger.info("Emitting matchUpdated event", { matchId: updatedMatch.id });
    io.to(req.params.id).emit("matchUpdated", updatedMatch);

    logger.info("Successfully removed player from match", {
      matchId: req.params.id,
      username,
    });
    res.json(updatedMatch);
  } catch (error) {
    logger.error("Error removing player from match", {
      matchId: req.params.id,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/v1/matches/:id - Delete a match
router.delete("/:id/", async (req, res) => {
  try {
    const match = await padelMatchService.getMatchById(req.params.id);
    if (!match) {
      logger.warn("Attempted to delete non-existent match", {
        matchId: req.params.id,
      });
      return res.status(404).json({ message: "Match not found" });
    }
    const io = req.app.get("socketio");
    logger.info("Emitting matchDeleted event", { matchId: req.params.id });
    io.to(req.params.id).emit("matchDeleted", req.params.id);
    const matches = await padelMatchService.deleteMatch(req.params.id);

    logger.info("Successfully deleted match", { matchId: req.params.id });
    res.json(matches);
  } catch (error) {
    logger.error("Error deleting match", {
      matchId: req.params.id,
      error: error.message,
    });
    res.status(404).json({ message: error.message });
  }
});

// GET /api/v1/matches/:id - Get a single match by ID
router.get("/:id", async (req, res) => {
  try {
    const match = await padelMatchService.getMatchById(req.params.id);
    logger.info("Successfully fetched match by ID", { matchId: req.params.id });
    res.json(match);
  } catch (error) {
    logger.error("Error fetching match", {
      matchId: req.params.id,
      error: error.message,
    });
    res.status(404).json({ message: error.message });
  }
});

// GET /api/v1/matches/player/:username - Get matches for a player by username
router.get("/player/:username", async (req, res) => {
  try {
    const username =
      req.params.username === "me" ? req.user.username : req.params.username;
    const matches = await padelMatchService.getMatchesByPlayer(username);
    logger.info("Successfully fetched matches for player", { username });
    res.json(matches);
  } catch (error) {
    logger.error("Error fetching player matches", {
      username: req.params.username,
      error: error.message,
    });
    res.status(404).json({ message: error.message });
  }
});

module.exports = router;
