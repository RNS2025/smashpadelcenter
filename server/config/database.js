const mongoose = require("mongoose");
const logger = require("./logger");
const dotenv = require("dotenv");
const path = require("path");
// Load .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });
// Set the MongoDB URI based on environment
const isDev = process.env.NODE_ENV === "developmemt";
const MONGODB_URI = isDev
  ? process.env.MONGODB_URI || "mongodb://localhost:27017/smashpadel"
  : "mongodb+srv://admin:Rise%40ndShine@cluster0.108ujbh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Log which environment and database we're using
logger.info(`Using ${isDev ? "development" : "production"} database`);

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    logger.info("Using existing MongoDB connection");
    return mongoose.connection;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("✅ Connected to MongoDB");
    logger.debug("MongoDB connection details", {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      port: mongoose.connection.port,
    });
    return mongoose.connection;
  } catch (err) {
    logger.error("MongoDB connection error:", {
      message: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

// Export the connection function and mongoose instance
module.exports = { connectDB, mongoose };
