const Trainer = require("../models/Trainer");

/**
 * Get all trainers
 * @returns {Promise<Array>} - List of all trainers
 */
const getAllTrainers = async () => {
  try {
    return await Trainer.find().lean();
  } catch (error) {
    console.error("Error fetching trainers:", error);
    throw new Error("Failed to fetch trainers");
  }
};

/**
 * Create a new trainer
 * @param {Object} trainerData - Trainer fields
 * @returns {Promise<Object>} - Created trainer
 */
const createTrainer = async (trainerData) => {
  try {
    const trainer = new Trainer(trainerData);
    return await trainer.save();
  } catch (error) {
    console.error("Error creating trainer:", error);
    throw new Error("Failed to create trainer");
  }
};

/**
 * Update a trainer by ID
 * @param {string} id - Trainer ID
 * @param {Object} updates - Updated fields
 * @returns {Promise<Object>} - Updated trainer
 */
const updateTrainer = async (id, updates) => {
  try {
    return await Trainer.findByIdAndUpdate(id, updates, { new: true });
  } catch (error) {
    console.error("Error updating trainer:", error);
    throw new Error("Failed to update trainer");
  }
};

/**
 * Delete a trainer by ID
 * @param {string} id - Trainer ID
 * @returns {Promise<Object>} - Deletion result
 */
const deleteTrainer = async (id) => {
  try {
    return await Trainer.findByIdAndDelete(id);
  } catch (error) {
    console.error("Error deleting trainer:", error);
    throw new Error("Failed to delete trainer");
  }
};

module.exports = {
  getAllTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
};
