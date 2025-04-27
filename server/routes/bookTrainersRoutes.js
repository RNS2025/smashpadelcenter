const express = require("express");
const router = express.Router();
const trainerService = require("../Services/trainerService");
const logger = require("../config/logger");

router.get("/trainers", async (req, res) => {
  try {
    const trainers = await trainerService.getAllTrainers();
    res.json(trainers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/trainers", async (req, res) => {
  try {
    const trainer = await trainerService.createTrainer(req.body);
    res.status(201).json(trainer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.get("/trainers", async (req, res) => {
  logger.debug("Fetching all trainers");
  try {
    const trainers = await trainerService.getAllTrainers();
    logger.info("Successfully retrieved all trainers", {
      count: trainers.length,
    });
    res.json(trainers);
  } catch (err) {
    logger.error("Error fetching trainers", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.post("/trainers", async (req, res) => {
  logger.debug("Creating new trainer", { trainerData: req.body });
  try {
    const trainer = await trainerService.createTrainer(req.body);
    logger.info("Trainer created successfully", { username: trainer.username });
    res.status(201).json(trainer);
  } catch (err) {
    logger.error("Error creating trainer", { error: err.message });
    res.status(400).json({ error: err.message });
  }
});
router.post("/book", async (req, res) => {
  try {
    const { username, trainerUsername, date, timeSlot } = req.body;
    const booking = await trainerService.bookTrainer(
      username,
      trainerUsername,
      date,
      timeSlot
    );
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/bookings/:username", async (req, res) => {
  try {
    const bookings = await trainerService.getUserBookings(req.params.username);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("trainer/message", async (req, res) => {
  try {
    const { senderUsername, trainerUsername, content } = req.body;
    const message = await trainerService.sendTrainerMessage(
      senderUsername,
      trainerUsername,
      content
    );
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/messages/:username/:trainerUsername", async (req, res) => {
  try {
    const { username, trainerUsername } = req.params;
    const messages = await trainerService.getTrainerMessages(
      username,
      trainerUsername
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get trainer by username
router.get("/trainers/by-username/:username", async (req, res) => {
  try {
    const trainer = await trainerService.getTrainerByUsername(
      req.params.username
    );
    res.json(trainer);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Add availability for a trainer
router.post("/trainers/availability/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { availability } = req.body;
    const updatedTrainer = await trainerService.addTrainerAvailability(
      username,
      availability
    );
    res.json(updatedTrainer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remove availability for a trainer
router.delete("/trainers/availability/:username/:date", async (req, res) => {
  try {
    const { username, date } = req.params;
    const updatedTrainer = await trainerService.removeTrainerAvailability(
      username,
      date
    );
    res.json(updatedTrainer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get trainer messages
router.get("/trainer-messages/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const messages = await trainerService.getAllTrainerMessages(username);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
