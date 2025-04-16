const express = require("express");
const router = express.Router();
const userProfileService = require("../Services/userProfileService");
const User = require("../models/user");

router.get("/by-username/:username", async (req, res) => {
  try {
    const profile = await userProfileService.getProfileByUsername(
      req.params.username
    );
    res.json(profile);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

router.post("/by-username/:username", async (req, res) => {
  try {
    const profile = await userProfileService.createUserProfile(
      req.params.username,
      req.body
    );
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/by-username/:username", async (req, res) => {
  try {
    const updatedProfile = await userProfileService.updateUserProfile(
      req.params.username,
      req.body
    );
    res.json(updatedProfile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const profile = await userProfileService.getProfileWithMatches(
      req.params.userId
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
