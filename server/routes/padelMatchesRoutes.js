const express = require("express");
const router = express.Router();
const padelMatchService = require("../Services/padelMatchService");
const PadelMatch = require("../models/PadelMatch");
const logger = require("../config/logger");
const { verifyJWT } = require("../middleware/jwt");
const NotificationHelper = require("../utils/notificationHelper");

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

    NotificationHelper.warning(
      username,
      "Din anmodning blev afvist",
      `Din anmodning om at deltage i matchen blev afvist af ${match.username}.`,
      `/makkerbørs/match/${req.params.id}`
    );

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

// PATCH /api/v1/matches/:id - Update match details
router.patch("/:id", async (req, res) => {
  try {
    const match = await padelMatchService.getMatchById(req.params.id);
    if (!match) {
      logger.warn("Attempted to update non-existent match", {
        matchId: req.params.id,
      });
      return res.status(404).json({ message: "Match not found" });
    }
    if (match.username !== req.user.username) {
      logger.warn("Unauthorized update attempt", {
        matchId: req.params.id,
        matchCreator: match.username,
        attemptedBy: req.user.username,
      });
      return res
        .status(403)
        .json({ message: "Only the match creator can update the match" });
    }
    const updatedMatch = await padelMatchService.updateMatch(
      req.params.id,
      req.body
    );

    logger.info("Successfully updated padel match", { matchId: req.params.id });
    res.json(updatedMatch);
  } catch (error) {
    logger.error("Error updating match", {
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

    NotificationHelper.success(
      username,
      "Din anmodning blev accepteret",
      `Du er nu accepteret til matchen af ${match.username}.`,
      `/makkerbørs/match/${req.params.id}`
    );

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

    NotificationHelper.notifyMultiple(
      usernames,
      "Du er inviteret til en padelmatch!",
      `${match.username} har inviteret dig til en match.`,
      "info",
      `/makkerbørs/match/${req.params.id}`
    );

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

    NotificationHelper.notify(
      match.username,
      "Ny anmodning om at deltage i din match",
      `${username} har anmodet om at deltage i din match.`,
      `/makkerbørs/match/${req.params.id}`
    );

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

    NotificationHelper.success(
      username,
      "Din deltagelse er bekræftet!",
      `Du er nu bekræftet som deltager i matchen.`,
      `/makkerbørs/match/${req.params.id}`
    );

    // Check if the match is now full
    const participantsCount = updatedMatch.participants?.length || 0;
    const reservedSpotsCount = updatedMatch.reservedSpots?.length || 0;

    if (participantsCount + reservedSpotsCount >= updatedMatch.totalSpots) {
      NotificationHelper.notifyMultiple(
        updatedMatch.participants,
        "Matchen er nu fuld!",
        `Alle pladser i matchen er nu besat.`,
        "info",
        `/makkerbørs/match/${req.params.id}`
      );
    }

    logger.info("Successfully confirmed user join", {
      matchId: req.params.id,
      username,
    });
    res.json(updatedMatch);
  } catch (error) {
    logger.error("PadelMatchRoutes: Error confirming join", {
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

    NotificationHelper.warning(
      username,
      "Du er blevet fjernet fra matchen",
      `Du er blevet fjernet fra matchen af ${match.username}.`,
      `/makkerbørs/match/${req.params.id}`
    );

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

    NotificationHelper.notifyMultiple(
      match.participants,
      "Matchen er blevet aflyst",
      `Matchen er blevet aflyst af ${match.username}.`,
      "warning",
      `/makkerbørs`
    );

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

// PATCH /api/v1/matches/:id/result - Update match result
router.patch("/:id/result", async (req, res) => {
  const matchId = req.params.id;
  const resultPayload = req.body;

  try {
    const updatedMatch = await padelMatchService.submitMatchResult(
      matchId,
      resultPayload
    );
    logger.info("Successfully submitted match result", { matchId });
    res.json(updatedMatch);
  } catch (error) {
    logger.error("Error submitting match result", {
      matchId,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

// PATCH /api/v1/matches/:id/confirm-result - Confirm match result
router.patch("/:id/confirm-result", async (req, res) => {
  const matchId = req.params.id;
  const resultPayload = req.body;

  try {
    const updatedMatch = await padelMatchService.confirmMatchResult(
      matchId,
      resultPayload
    );
    logger.info("Successfully confirmed match result", { matchId });
    res.json(updatedMatch);
  } catch (error) {
    logger.error("Error confirming match result", {
      matchId,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
