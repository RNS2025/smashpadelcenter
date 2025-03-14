const User = require("../models/user");

async function createAdmin() {
  try {
    const [admin, created] = await User.findOrCreate({
      where: { username: "admin" },
      defaults: {
        password: "admin", // Change this to a secure password
        role: "admin",
      },
    });
    if (created) {
      console.log("Admin user created:", admin.username);
    } else {
      console.log("Admin user already exists:", admin.username);
    }
  } catch (err) {
    console.error("Error creating admin user:", err.message);
  }
}

module.exports = createAdmin;
