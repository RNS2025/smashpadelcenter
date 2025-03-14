const User = require("../models/user");
const bcrypt = require("bcrypt");

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash("admin", 10);
    const [admin, created] = await User.findOrCreate({
      where: { username: "admin" },
      defaults: {
        password: hashedPassword,
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
