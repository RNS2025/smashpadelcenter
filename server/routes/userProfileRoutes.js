const express = require("express");
const router = express.Router();
const databaseService = require("../Services/databaseService");
const logger = require("../config/logger"); // Import logger
const { verifyJWT } = require("../middleware/jwt");
router.use(verifyJWT);

router.get("/by-username/:username", async (req, res) => {
  try {
    const username =
      req.params.username === "me" && req.user
        ? req.user.username
        : req.params.username;
    const profile = await databaseService.getProfileByUsername(username);
    logger.info("Successfully fetched profile by username", { username });
    res.json(profile);
  } catch (error) {
    logger.error("Error fetching profile by username", {
      username: req.params.username,
      error: error.message,
    });
    res.status(404).json({ message: error.message });
  }
});

router.put("/by-username/:username", async (req, res) => {
  try {
    const username =
      req.params.username === "me" && req.user
        ? req.user.username
        : req.params.username;
    const updatedProfile = await databaseService.updateUserProfile(
      username,
      req.body
    );
    logger.info("Successfully updated user profile", { username });
    res.json(updatedProfile);
  } catch (error) {
    logger.error("Error updating user profile", {
      username: req.params.username,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const profile = await databaseService.getProfileWithMatches(
      req.params.userId
    );
    logger.info("Successfully fetched profile with matches", {
      userId: req.params.userId,
    });
    res.json(profile);
  } catch (error) {
    logger.error("Error fetching profile with matches", {
      userId: req.params.userId,
      error: error.message,
    });
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
