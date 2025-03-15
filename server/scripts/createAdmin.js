const User = require("../models/user");
const argon2 = require("argon2");

async function createAdmin() {
  try {
    // Check if the user already exists
    const user = await User.findOne({ username: "admin" });

    if (user) {
      console.log("Admin user already exists:", user.username);
      return;
    }

    // If user doesn't exist, create a new user
    const hashedPassword = await argon2.hash("admin");
    const newAdmin = await User.create({
      username: "admin",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin user created:", newAdmin.username);
  } catch (err) {
    console.error("Error creating admin user:", err.message);
  }
}

module.exports = createAdmin;
