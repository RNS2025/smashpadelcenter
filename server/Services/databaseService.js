const User = require("../models/user");

/**
 * Create a new user with optional password for local login or OAuth provider details.
 * @param {Object} userData - The user data (username, email, provider, providerId, password)
 * @returns {Promise<Object>} The newly created user object
 * @throws {Error} If username or email already exists
 */
async function createUser(userData) {
  const {
    username,
    email = "empty",
    provider = "local",
    providerId = null,
    password,
  } = userData;
  try {
    // Check if username already exists (not checking email)
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Check if providerId already exists (for social logins)
    if (provider !== "local" && providerId) {
      const existingProvider = await User.findOne({ provider, providerId });
      if (existingProvider) {
        throw new Error("User already exists with this provider account");
      }
    }

    const newUser = new User({
      username,
      email: email || null,
      provider: provider || "local",
      providerId: provider === "local" ? null : providerId,
      password: provider === "local" ? password : undefined,
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
    return await User.find({}, "username role email provider");
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
 * Find a user by email.
 * @param {String} email - The email of the user to find
 * @returns {Promise<Object|null>} The user object if found, else null
 */
async function findUserByEmail(email) {
  try {
    return await User.findOne({ email });
  } catch (err) {
    throw new Error("Error finding user: " + err.message);
  }
}

/**
 * Find a user by OAuth provider and providerId.
 * @param {String} provider - The OAuth provider (google, facebook, github)
 * @param {String} providerId - The provider's unique ID for the user
 * @returns {Promise<Object|null>} The user object if found, else null
 */
async function findUserByProvider(provider, providerId) {
  try {
    return await User.findOne({ provider, providerId });
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
  findUserByEmail,
  findUserByProvider,
  updateUserRole,
};
