// tests/triggerMatchNotification.js
// This test script manually triggers the match notification check

// Set environment to development to use local MongoDB
process.env.NODE_ENV = "development";

// Import required modules
const mongoose = require("mongoose");
const logger = require("../config/logger");
const { connectDB } = require("../config/database"); // Import the connectDB function
const {
  checkAndNotifyAboutUpcomingMatches,
} = require("../Schedules/TournamentNotificationSchedule");

// Log start of test
logger.info("=== MANUAL TEST: Match notification check ===");
logger.info(`Using ${process.env.NODE_ENV} environment`);

// Initialize connection and run tests
async function runTest() {
  try {
    // Explicitly connect to the database
    await connectDB();
    logger.info(
      "Database connection established, running match notification check..."
    );

    // Wait a moment to ensure all models are registered
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Run the match notification check
    await checkAndNotifyAboutUpcomingMatches();
    logger.info("✅ Match notification check completed successfully");
  } catch (error) {
    logger.error("❌ Error running match notification check:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    logger.info("Closing database connection...");
    setTimeout(async () => {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        logger.info("Database connection closed");
      }
      process.exit(0);
    }, 2000); // Allow time for logs to be written and connection to close
  }
}

// Run the test with timeout protection
const timeout = setTimeout(() => {
  logger.error("Test execution timed out after 20 seconds");
  process.exit(1);
}, 20000);

// Start the test
runTest().finally(() => clearTimeout(timeout));
