const mongoose = require("mongoose");
const logger = require("./logger");

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:<db_password>@cluster0.108ujbh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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
