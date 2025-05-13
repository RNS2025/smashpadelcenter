const User = require("../models/user");
const PadelMatch = require("../models/PadelMatch");
const logger = require("../config/logger");

module.exports = {
  createUser: async (userData) => {
    const {
      username,
      email = "",
      provider = "local",
      providerId = null,
      password,
      fullName = "",
      phoneNumber = "",
      profilePictureUrl = "/api/placeholder/150/150",
      skillLevel = 1,
      position = "Begge",
      playingStyle = "",
      equipment = "",
      groups = [],
      rankedInId = "",
    } = userData;
    try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new Error("Username already exists");
      }
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
        fullName,
        phoneNumber,
        profilePictureUrl,
        skillLevel,
        position,
        playingStyle,
        equipment,
        groups: [],
        rankedInId,
      });
      await newUser.save();
      return newUser;
    } catch (err) {
      logger.error("DatabaseService: Error creating user:", {
        error: err.message,
        username: userData.username,
      });
      throw new Error("Error creating user: " + err.message);
    }
  },

  getAllUserProfiles: async () => {
    try {
      const users = await User.find(
        {},
        "username email fullName profilePictureUrl createdAt updatedAt"
      );
      logger.info("DatabaseService: Fetched all user profiles", {
        count: users.length,
      });

      const formattedUsers = users.map((user) => {
        // Split fullName into firstName and lastName if available
        let firstName = "";
        let lastName = "";
        if (user.fullName) {
          const nameParts = user.fullName.trim().split(" ");
          firstName = nameParts[0];
          lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        }

        return {
          id: user._id.toString(),
          username: user.username,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          fullName: user.fullName || undefined,
        };
      });

      return formattedUsers;
    } catch (err) {
      logger.error("DatabaseService: Error fetching all user profiles", {
        error: err.message,
      });
      throw new Error("Error fetching user profiles: " + err.message);
    }
  },

  getAllUsers: async () => {
    try {
      return await User.find({}, "username role email provider fullName");
    } catch (err) {
      throw new Error("Error fetching users: " + err.message);
    }
  },

  findUserByUsername: async (username) => {
    try {
      return await User.findOne({ username });
    } catch (err) {
      throw new Error("Error finding user: " + err.message);
    }
  },

  findUserByEmail: async (email) => {
    try {
      return await User.findOne({ email });
    } catch (err) {
      throw new Error("Error finding user: " + err.message);
    }
  },

  findUserByProvider: async (provider, providerId) => {
    try {
      return await User.findOne({ provider, providerId });
    } catch (err) {
      throw new Error("Error finding user: " + err.message);
    }
  },

  updateUserRole: async (username, newRole) => {
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
  },

  updateUserProfile: async (username, updateData) => {
    console.log(
      `[DEBUG] Updating profile for username: ${username}`,
      updateData
    );
    try {
      console.log(`[DEBUG] Finding and updating user in database`);
      const user = await User.findOneAndUpdate(
        { username },
        { $set: updateData },
        { new: true }
      ).populate("matchHistory");

      if (!user) {
        console.log(`[DEBUG] User not found: ${username}`);
        throw new Error("User not found");
      }

      console.log(`[DEBUG] User found and updated: ${user._id}`);
      console.log(`[DEBUG] Fetching matches for user: ${user.username}`);
      const matches = await PadelMatch.find({
        participants: user.username,
      });

      console.log(`[DEBUG] Found ${matches.length} matches for user`);
      const now = new Date();
      const pastMatches = matches
        .filter((m) => new Date(m.matchDateTime) <= now)
        .map((m) => ({
          id: m._id.toString(),
          date: new Date(m.matchDateTime).toISOString(),
          opponent:
            m.participants.filter((p) => p !== user.username).join(", ") ||
            "Unknown",
          score: m.score || "TBD",
          result: m.result || "unknown",
        }));

      console.log(`[DEBUG] Processed ${pastMatches.length} past matches`);
      console.log(`[DEBUG] Getting stats for user: ${user._id}`);
      const stats = await module.exports.getUserStats(user._id);

      console.log(`[DEBUG] Returning updated profile data`);
      return {
        id: user._id.toString(),
        username: user.username,
        email: user.email || "",
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        profilePictureUrl: user.profilePictureUrl || "/api/placeholder/150/150",
        skillLevel: user.skillLevel || 1,
        position: user.position || "Begge",
        playingStyle: user.playingStyle || "",
        equipment: user.equipment || "",
        role: user.role || "user",
        pastMatches,
        stats,
        groups: user.groups || [],
        rankedInId: user.rankedInId || "",
      };
    } catch (err) {
      console.error(`[DEBUG] Error updating profile for ${username}:`, err);
      throw new Error("Error updating user profile: " + err.message);
    }
  },

  getUserStats: async (username) => {
    console.log(`[DEBUG] Getting stats for username: ${username}`);
    const user = await User.findOne(username);
    if (!user) throw new Error("User not found");
    const matches = await PadelMatch.find({
      participants: user.username,
      result: { $in: ["win", "loss"] },
    });
    const wins = matches.filter((m) => m.result === "win").length;
    const losses = matches.filter((m) => m.result === "loss").length;
    const totalMatches = wins + losses;
    return {
      matches: totalMatches,
      wins,
      losses,
    };
  },
  createPadelMatch: async (matchData) => {
    const {
      matchDateTime,
      participants,
      score = "TBD",
      result = "unknown",
    } = matchData;
    try {
      // Validate participants
      if (!participants || participants.length < 2) {
        throw new Error("At least two participants are required");
      }

      // Verify all participants exist
      const users = await User.find({ username: { $in: participants } });
      if (users.length !== participants.length) {
        throw new Error("One or more participants not found");
      }

      // Create the match
      const newMatch = new PadelMatch({
        matchDateTime,
        participants,
        score,
        result,
      });
      await newMatch.save();
      console.log("Created match:", newMatch);

      // Update each participant's matchHistory
      await User.updateMany(
        { username: { $in: participants } },
        { $push: { matchHistory: newMatch._id } }
      );
      console.log("Updated matchHistory for participants:", participants);

      // Fetch the match with populated data
      const populatedMatch = await PadelMatch.findById(newMatch._id);
      return {
        id: populatedMatch._id.toString(),
        date: populatedMatch.matchDateTime.toISOString(),
        participants: populatedMatch.participants,
        score: populatedMatch.score,
        result: populatedMatch.result,
      };
    } catch (err) {
      console.error("Error creating match:", err.message);
      throw new Error("Error creating match: " + err.message);
    }
  },

  // Update existing getProfileWithMatches to ensure matches are returned
  getProfileWithMatches: async (userId) => {
    try {
      const user = await User.findById(userId)
        .populate("matchHistory")
        // Add any other necessary .populate() calls here if needed for the profile
        .lean(); // .lean() returns a plain JavaScript object, good for read-only operations

      if (!user) {
        logger.error(
          `DatabaseService: User not found in getProfileWithMatches with ID: ${userId}`
        );
        throw new Error("User not found");
      }

      // Construct the profile object to be returned, ensuring all necessary fields are present.
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profilePictureUrl: user.profilePictureUrl,
        skillLevel: user.skillLevel,
        phoneNumber: user.phoneNumber,
        position: user.position,
        playingStyle: user.playingStyle,
        equipment: user.equipment,
        matchHistory: user.matchHistory, // Populated
        groups: user.groups,
        rankedInId: user.rankedInId,
        createdAt: user.createdAt,
        role: user.role, // Added role as it's often useful in profiles
        // --- Ensure stats are included ---
        stats: user.stats, // This will include matches, wins, losses, draws from the user document
        // Add any other fields that should be part of the comprehensive profile
      };
    } catch (err) {
      logger.error(
        `DatabaseService: Error in getProfileWithMatches for userId ${userId}: ${err.message}`
      );
      throw err; // Re-throw the error to be handled by the calling route
    }
  },

  getProfileByUsername: async (username) => {
    const user = await User.findOne({ username }); // This fetches the user document, including its 'stats' field
    if (!user) {
      logger.error(
        `DatabaseService: User not found by username: ${username} in getProfileByUsername`
      );
      // It's important to throw an error that the route can catch and respond with a 404
      throw new Error(`User profile not found for username: ${username}`);
    }
    // The 'user' object from findOne already contains the stats.
    // Now, call getProfileWithMatches to potentially populate other details like matchHistory
    // and ensure a consistent profile object structure.
    return await module.exports.getProfileWithMatches(user._id);
  },
};
