const { mongoose } = require("../config/database");
const databaseService = require("../Services/databaseService");
const logger = require("../config/logger"); // Import Winston logger

async function createAdmin() {
  try {
    // Ensure MongoDB connection is active
    if (mongoose.connection.readyState !== 1) {
      throw new Error("No active MongoDB connection. Run server.js first.");
    }

    const admin = await databaseService.findUserByUsername("admin");
    if (!admin) {
      const newAdmin = await databaseService.createUser({
        username: "admin",
        email: "admin@smashpadel.com",
        password: "admin",
        provider: "local",
        role: "admin",
      });
      logger.info(`Admin user created: ${newAdmin.username}`);
    } else {
      logger.info("Admin user already exists.");
    }
  } catch (err) {
    logger.error("Error creating admin:", {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

module.exports = createAdmin;
