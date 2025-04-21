const User = require("../models/user");

/**
 * Create a new user and hash the password using Argon2.
 * @param {Object} userData - The user data (username and password)
 * @returns {Promise<Object>} The newly created user object
 * @throws {Error} If username already exists
 */
async function createUser(userData) {
  const { username, password } = userData;
  try {
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new Error("Username already exists");
    }

    const newUser = new User({
      username,
      password, // The password will be hashed by Mongoose pre-save hook
      role: "user",
    });
    await newUser.save();
    return newUser;
  } catch (err) {
    throw new Error("Error creating user: " + err.message);
  }
}

/**
 * Find all users with their roles.
 * @returns {Promise<Array>} A list of users with their roles
 */
async function getAllUsers() {
  try {
    return await User.find({}, "username role"); // Return only username and role
  } catch (err) {
    throw new Error("Error fetching users: " + err.message);
  }
}

/**
 * Find a user by username.
 * @param {String} username - The username of the user to find
 * @returns {Promise<Object|null>} The user object if found, else null
 */
async function findUserByUsername(username) {
  try {
    return await User.findOne({ username });
  } catch (err) {
    throw new Error("Error finding user: " + err.message);
  }
}

/**
 * Update the role of a user.
 * @param {String} username - The username of the user
 * @param {String} newRole - The new role to assign to the user
 * @returns {Promise<Object>} The updated user object
 */
async function updateUserRole(username, newRole) {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error("User not found");
    }
    user.role = newRole;
    await user.save();
    return user;
  } catch (err) {
    throw new Error("Error updating user role: " + err.message);
  }
}

module.exports = {
  createUser,
  getAllUsers,
  findUserByUsername,
  updateUserRole,
};
