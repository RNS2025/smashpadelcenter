const { mongoose } = require("../config/database");
const databaseService = require("../Services/databaseService");

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
      console.log("Admin user created:", newAdmin.username);
    } else {
      console.log("Admin user already exists.");
    }
  } catch (err) {
    console.error("Error creating admin:", err.message);
    throw err;
  }
}

module.exports = createAdmin;
