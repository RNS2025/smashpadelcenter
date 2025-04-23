const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/smashpadel";

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    console.log("Using existing MongoDB connection");
    return mongoose.connection;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}

// Export the connection function and mongoose instance
module.exports = { connectDB, mongoose };
