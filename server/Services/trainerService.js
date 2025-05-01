const { Trainer, Booking, TrainerMessage } = require("../models/Trainer");
const User = require("../models/user");
const { updateUserRole } = require("./databaseService");
const logger = require("../config/logger");

const getAllTrainers = async () => {
  try {
    const trainers = await Trainer.find().lean();
    const idSet = new Set(trainers.map((t) => t._id.toString()));
    if (idSet.size !== trainers.length) {
      logger.warn("TrainerService: Duplicate trainer _id values detected:", {
        trainerIds: trainers.map((t) => t._id),
      });
    }
    return trainers;
  } catch (error) {
    logger.error("TrainerService: Error fetching trainers:", {
      error: error.message,
    });
    throw new Error("Failed to fetch trainers");
  }
};

const createTrainer = async (trainerData) => {
  try {
    const user = await User.findOne({ username: trainerData.username });
    if (!user) {
      throw new Error("User with provided username does not exist");
    }
    const existingTrainer = await Trainer.findOne({
      username: trainerData.username,
    });
    if (existingTrainer) {
      throw new Error("Trainer with this username already exists");
    }

    await updateUserRole(trainerData.username, "trainer");

    trainerData.availability = Array.isArray(trainerData.availability)
      ? trainerData.availability
      : [];
    const trainer = new Trainer(trainerData);
    const savedTrainer = await trainer.save();

    logger.info("TrainerService: Trainer created successfully", {
      trainer: savedTrainer,
    });
    return savedTrainer;
  } catch (error) {
    logger.error("TrainerService: Error creating trainer:", {
      error: error.message,
    });
    throw new Error("Failed to create trainer");
  }
};

const bookTrainer = async (username, trainerUsername, date, timeSlot) => {
  try {
    const trainer = await Trainer.findOne({ username: trainerUsername });
    if (!trainer) throw new Error("Trainer not found");
    const availability = trainer.availability.find(
      (avail) => avail.date.toISOString().split("T")[0] === date
    );
    if (!availability) throw new Error("No availability for selected date");
    const slot = availability.timeSlots.find(
      (slot) => slot.startTime === timeSlot && !slot.isBooked
    );
    if (!slot) throw new Error("Time slot not available");
    slot.isBooked = true;
    slot.bookedBy = username;
    await trainer.save();
    const booking = new Booking({
      username,
      trainerId: trainer._id,
      date: new Date(date),
      timeSlot,
      status: "pending",
    });
    const savedBooking = await booking.save();

    logger.info("TrainerService: Booking created successfully", {
      booking: savedBooking,
    });
    return savedBooking;
  } catch (error) {
    logger.error("TrainerService: Error booking trainer:", {
      error: error.message,
    });
    throw new Error("Failed to book trainer");
  }
};

const getUserBookings = async (username) => {
  try {
    const bookings = await Booking.find({ username })
      .populate("trainerId", "name specialty")
      .lean();
    logger.info("TrainerService: User bookings fetched successfully", {
      username,
      bookings,
    });
    return bookings;
  } catch (error) {
    logger.error("TrainerService: Error fetching bookings:", {
      error: error.message,
    });
    throw new Error("Failed to fetch bookings");
  }
};

const sendTrainerMessage = async (senderUsername, trainerUsername, content) => {
  try {
    const trainer = await Trainer.findOne({ username: trainerUsername });
    if (!trainer) throw new Error("Trainer not found");
    const message = new TrainerMessage({
      senderUsername,
      trainerUsername,
      content,
    });
    const savedMessage = await message.save();

    logger.info("TrainerService: Message sent successfully", {
      message: savedMessage,
    });
    return savedMessage;
  } catch (error) {
    logger.error("TrainerService: Error sending message:", {
      error: error.message,
    });
    throw new Error("Failed to send message");
  }
};

const getTrainerMessages = async (username, trainerUsername) => {
  try {
    const trainer = await Trainer.findOne({ username: trainerUsername });
    if (!trainer) throw new Error("Trainer not found");

    const messages = await TrainerMessage.find({
      $or: [
        { senderUsername: username, trainerUsername },
        { senderUsername: trainerUsername, trainerUsername: username },
      ],
    }).lean();

    const uniqueMessages = Array.from(
      new Map(messages.map((msg) => [msg._id.toString(), msg])).values()
    );

    logger.info("TrainerService: Trainer messages fetched successfully", {
      username,
      trainerUsername,
      messages: uniqueMessages,
    });
    return uniqueMessages;
  } catch (error) {
    logger.error("TrainerService: Error fetching messages:", {
      error: error.message,
    });
    throw new Error("Failed to fetch messages");
  }
};

const getTrainerByUsername = async (username) => {
  try {
    const trainer = await Trainer.findOne({ username });
    if (!trainer) throw new Error("Trainer not found");
    logger.info("TrainerService: Trainer fetched successfully", {
      username,
      trainer,
    });
    return trainer;
  } catch (error) {
    logger.error("TrainerService: Error fetching trainer:", {
      error: error.message,
    });
    throw new Error("Failed to fetch trainer");
  }
};

const addTrainerAvailability = async (username, availabilityData) => {
  try {
    const trainer = await Trainer.findOne({ username });
    if (!trainer) throw new Error("Trainer not found");

    const formattedDate = new Date(availabilityData.date);
    formattedDate.setHours(12, 0, 0, 0);

    const existingAvailability = trainer.availability.find(
      (avail) =>
        new Date(avail.date).toISOString().split("T")[0] ===
        formattedDate.toISOString().split("T")[0]
    );

    if (existingAvailability) {
      existingAvailability.timeSlots = [
        ...existingAvailability.timeSlots,
        ...availabilityData.timeSlots.filter(
          (newSlot) =>
            !existingAvailability.timeSlots.some(
              (existingSlot) => existingSlot.startTime === newSlot.startTime
            )
        ),
      ];
    } else {
      trainer.availability.push({
        date: formattedDate,
        timeSlots: availabilityData.timeSlots,
      });
    }

    const updatedTrainer = await trainer.save();

    logger.info("TrainerService: Trainer availability added successfully", {
      username,
      availability: updatedTrainer.availability,
    });
    return updatedTrainer;
  } catch (error) {
    logger.error("TrainerService: Error adding trainer availability:", {
      error: error.message,
    });
    throw new Error("Failed to add trainer availability");
  }
};

const removeTrainerAvailability = async (username, date) => {
  try {
    const trainer = await Trainer.findOne({ username });
    if (!trainer) throw new Error("Trainer not found");

    trainer.availability = trainer.availability.filter(
      (avail) => new Date(avail.date).toISOString().split("T")[0] !== date
    );

    const updatedTrainer = await trainer.save();

    logger.info("TrainerService: Trainer availability removed successfully", {
      username,
      date,
    });
    return updatedTrainer;
  } catch (error) {
    logger.error("TrainerService: Error removing trainer availability:", {
      error: error.message,
    });
    throw new Error("Failed to remove trainer availability");
  }
};

const getAllTrainerMessages = async (trainerUsername) => {
  try {
    const messages = await TrainerMessage.find({ trainerUsername })
      .sort({ createdAt: -1 })
      .lean();
    logger.info("TrainerService: All trainer messages fetched successfully", {
      trainerUsername,
      messages,
    });
    return messages;
  } catch (error) {
    logger.error("TrainerService: Error fetching trainer messages:", {
      error: error.message,
    });
    throw new Error("Failed to fetch trainer messages");
  }
};

module.exports = {
  getAllTrainers,
  createTrainer,
  bookTrainer,
  getUserBookings,
  sendTrainerMessage,
  getTrainerMessages,
  getTrainerByUsername,
  addTrainerAvailability,
  removeTrainerAvailability,
  getAllTrainerMessages,
};
