const User = require("../models/user");
const argon2 = require("argon2");

async function createTenUsers() {
  try {
    const users = [
      { username: "user1", password: "password1", role: "user" },
      { username: "user2", password: "password2", role: "user" },
      { username: "user3", password: "password3", role: "user" },
      { username: "user4", password: "password4", role: "user" },
      { username: "user5", password: "password5", role: "user" },
      { username: "user6", password: "password6", role: "user" },
      { username: "user7", password: "password7", role: "user" },
      { username: "user8", password: "password8", role: "user" },
      { username: "user9", password: "password9", role: "user" },
      { username: "user10", password: "password10", role: "user" },
    ];

    for (const user of users) {
      // Check if the user already exists
      const existingUser = await User.findOne({
        where: { username: user.username },
      });

      if (existingUser) {
        console.log(`User ${user.username} already exists.`);
      } else {
        const newUser = await User.create(user);
        console.log(`User ${newUser.username} created successfully.`);
      }
    }
  } catch (err) {
    console.error("Error creating users:", err.message);
  }
}

createTenUsers();
module.exports = createTenUsers;
