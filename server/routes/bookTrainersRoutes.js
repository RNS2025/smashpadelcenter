const express = require("express");
const router = express.Router();
const trainerService = require("../Services/trainerService");

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

router.post("/message", async (req, res) => {
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

module.exports = router;
