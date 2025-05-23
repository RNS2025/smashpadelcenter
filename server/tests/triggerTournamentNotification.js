// triggerTournamentNotification.js
// This is a simple test script to manually trigger tournament notifications
// Run it with: node tests/triggerTournamentNotification.js

// Set environment to development
process.env.NODE_ENV = "development";

const {
  checkAndNotifyAboutTournaments,
} = require("../Schedules/TournamentNotificationSchedule");
const { connectDB } = require("../config/database");
const dotenv = require("dotenv");
const path = require("path");
const logger = require("../config/logger");

// Load .env file
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

async function testNotifications() {
  try {
    logger.info("=== MANUAL TEST: Tournament notification check ===");
    logger.info(`Using ${process.env.NODE_ENV} environment`);
    logger.info("Connecting to database...");
    await connectDB();

    logger.info("Triggering tournament notifications...");
    await checkAndNotifyAboutTournaments();

    logger.info("Tournament notifications triggered successfully");

    // Wait a bit to allow async operations to complete
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  } catch (error) {
    logger.error("Error running tournament notifications:", error);
    process.exit(1);
  }
}

// Run the test
testNotifications();
