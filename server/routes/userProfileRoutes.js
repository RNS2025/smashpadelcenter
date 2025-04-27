const express = require("express");
const router = express.Router();
const databaseService = require("../Services/databaseService");


router.get("/by-username/:username", async (req, res) => {
  try {
    const username =
      req.params.username === "me" && req.isAuthenticated()
        ? req.user.username
        : req.params.username;
    const profile = await databaseService.getProfileByUsername(username);
    res.json(profile);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

router.put("/by-username/:username", async (req, res) => {
  try {
    const username =
      req.params.username === "me" && req.isAuthenticated()
        ? req.user.username
        : req.params.username;
    const updatedProfile = await databaseService.updateUserProfile(
      username,
      req.body
    );
    res.json(updatedProfile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const profile = await databaseService.getProfileWithMatches(
      req.params.userId
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
