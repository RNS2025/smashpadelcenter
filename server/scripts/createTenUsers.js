const { connectDB, mongoose } = require("../config/database");
const databaseService = require("../Services/databaseService");
const logger = require("../config/logger"); // Import Winston logger

async function createTenUsers() {
  try {
    // Ensure MongoDB connection is active
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Failed to establish MongoDB connection.");
    }

    const users = [
      {
        username: "user1",
        email: "user1@smashpadel.com",
        password: "password1",
        provider: "local",
        role: "user",
      },
      {
        username: "user2",
        email: "user2@smashpadel.com",
        password: "password2",
        provider: "local",
        role: "user",
      },
      {
        username: "user3",
        email: "user3@smashpadel.com",
        password: "password3",
        provider: "local",
        role: "user",
      },
      {
        username: "user4",
        email: "user4@smashpadel.com",
        password: "password4",
        provider: "local",
        role: "user",
      },
      {
        username: "user5",
        email: "user5@smashpadel.com",
        password: "password5",
        provider: "local",
        role: "user",
      },
      {
        username: "user6",
        email: "user6@smashpadel.com",
        password: "password6",
        provider: "local",
        role: "user",
      },
      {
        username: "user7",
        email: "user7@smashpadel.com",
        password: "password7",
        provider: "local",
        role: "user",
      },
      {
        username: "user8",
        email: "user8@smashpadel.com",
        password: "password8",
        provider: "local",
        role: "user",
      },
      {
        username: "user9",
        email: "user9@smashpadel.com",
        password: "password9",
        provider: "local",
        role: "user",
      },
      {
        username: "user10",
        email: "user10@smashpadel.com",
        password: "password10",
        provider: "local",
        role: "user",
      },
    ];

    for (const user of users) {
      try {
        // Check if the user already exists by username or email
        const existingUser =
          (await databaseService.findUserByUsername(user.username)) ||
          (await databaseService.findUserByEmail(user.email));

        if (existingUser) {
          logger.info(
            `User ${user.username} or email ${user.email} already exists. Skipping.`
          );
          continue;
        }

        const newUser = await databaseService.createUser(user);
        logger.info(
          `User ${newUser.username} created successfully with ID: ${newUser._id}`
        );
      } catch (err) {
        logger.error(`Error creating user ${user.username}:`, {
          error: err.message,
          stack: err.stack,
        });
      }
    }

    logger.info("User creation process completed successfully.");
  } catch (err) {
    logger.error("Error in createTenUsers:", {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

module.exports = createTenUsers;
