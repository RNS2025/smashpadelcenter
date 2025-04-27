const PadelMatch = require("../models/PadelMatch");
const User = require("../models/user");
const logger = require("../config/logger");

const padelMatchService = {
  getAllMatches: async () => {
    try {
      const matches = await PadelMatch.find();
      logger.debug("PadelMatchService: Retrieved all matches", {
        count: matches.length,
      });
      return matches.map((match) => ({
        ...match.toObject(),
        id: match._id.toString(),
      }));
    } catch (error) {
      logger.error("PadelMatchService: Error fetching all matches:", {
        error: error.message,
      });
      throw new Error("Failed to fetch matches");
    }
  },

  invitePlayers: async (matchId, usernames) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) throw new Error("Match not found");

      // Validate usernames (ensure they exist in the User collection)
      const validUsers = await User.find({ username: { $in: usernames } });
      const validUsernames = validUsers.map((user) => user.username);
      const invalidUsernames = usernames.filter(
        (username) => !validUsernames.includes(username)
      );
      if (invalidUsernames.length > 0) {
        throw new Error(`Invalid usernames: ${invalidUsernames.join(", ")}`);
      }

      const newInviteRequests = usernames.filter(
        (username) =>
          !match.participants.includes(username) &&
          !match.invitePlayers.includes(username)
      );

      if (newInviteRequests.length === 0) {
        throw new Error("All users are already invited or participants");
      }

      // Check if match is full (excluding creator, max 3 additional players)
      const nonOwnerParticipants = match.participants.filter(
        (p) => p !== match.username
      );
      if (
        nonOwnerParticipants.length +
          match.reservedSpots.length +
          newInviteRequests.length >
        3
      ) {
        throw new Error(
          "Match is full or would exceed capacity with these invites"
        );
      }

      // Add new join requests
      match.invitePlayers.push(...newInviteRequests);
      await match.save();
      const updatedMatch = {
        ...match.toObject(),
        id: match._id.toString(),
        participants: match.participants || [],
        joinRequests: match.joinRequests || [],
        reservedSpots: match.reservedSpots || [],
        invitePlayers: match.invitePlayers || [],
        totalSpots: match.totalSpots || 4,
      };
      console.log("invitePlayers updated match:", updatedMatch);
      return updatedMatch;
    } catch (error) {
      logger.error("PadelMatchService: Error inviting players", {
        matchId,
        usernames,
        error: error.message,
      });
      throw new Error("Error inviting players: " + error.message);
    }
  },

  createMatch: async (matchData) => {
    try {
      // Ensure participants include the creator and filter duplicates
      const participants = [
        matchData.username,
        ...(matchData.participants || []).filter(
          (p) => p !== matchData.username
        ),
      ];
      const newMatch = new PadelMatch({
        ...matchData,
        participants,
        joinRequests: matchData.joinRequests || [],
        reservedSpots: matchData.reservedSpots || [],
        totalSpots: matchData.totalSpots || 4,
      });

      const savedMatch = await newMatch.save();
      console.log("Created match:", savedMatch);

      // Update matchHistory for all participants
      await User.updateMany(
        { username: { $in: participants } },
        { $push: { matchHistory: savedMatch._id } }
      );
      console.log("Updated matchHistory for participants:", participants);

      return {
        ...savedMatch.toObject(),
        id: savedMatch._id.toString(),
      };
    } catch (error) {
      console.error("Error creating match:", error.message);
      throw new Error("Error creating match: " + error.message);
    }
  },

  joinMatch: async (matchId, username) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) throw new Error("Match not found");
      if (
        match.participants.includes(username) ||
        match.joinRequests.includes(username)
      ) {
        throw new Error("User already in participants or join requests");
      }
      const nonOwnerParticipants = match.participants.filter(
        (p) => p !== match.username
      );
      if (nonOwnerParticipants.length + match.reservedSpots.length >= 3) {
        throw new Error("Match is full");
      }
      match.joinRequests.push(username);
      await match.save();
      const updatedMatch = {
        ...match.toObject(),
        id: match._id.toString(),
        participants: match.participants || [],
        joinRequests: match.joinRequests || [],
        reservedSpots: match.reservedSpots || [],
        totalSpots: match.totalSpots || 4,
      };
      console.log("joinMatch updated match:", updatedMatch);
      return updatedMatch;
    } catch (error) {
      console.error("Error joining match:", error.message);
      throw new Error("Error joining match: " + error.message);
    }
  },

  confirmJoin: async (matchId, username) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) throw new Error("Match not found");
      if (!match.joinRequests.includes(username)) {
        throw new Error("No join request found for this user");
      }
      const nonOwnerParticipants = match.participants.filter(
        (p) => p !== match.username
      );
      if (nonOwnerParticipants.length + match.reservedSpots.length >= 3) {
        throw new Error("Match is full");
      }
      match.joinRequests = match.joinRequests.filter((req) => req !== username);
      match.participants.push(username);
      await match.save();

      // Update matchHistory for the confirmed user
      await User.updateOne(
        { username },
        { $push: { matchHistory: match._id } }
      );
      console.log("Updated matchHistory for user:", username);

      const updatedMatch = {
        ...match.toObject(),
        id: match._id.toString(),
        participants: match.participants || [],
        joinRequests: match.joinRequests || [],
        reservedSpots: match.reservedSpots || [],
        totalSpots: match.totalSpots || 4,
      };
      console.log("confirmJoin updated match:", updatedMatch);
      return updatedMatch;
    } catch (error) {
      console.error("Error confirming join:", error.message);
      throw new Error("Error confirming join: " + error.message);
    }
  },

  reserveSpots: async (matchId, spotIndex, reserve) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) throw new Error("Match not found");
      if (spotIndex < 0 || spotIndex >= match.totalSpots) {
        throw new Error("Invalid spot index");
      }
      if (reserve) {
        if (!match.reservedSpots.includes(spotIndex)) {
          match.reservedSpots.push(spotIndex);
        }
      } else {
        match.reservedSpots = match.reservedSpots.filter(
          (spot) => spot !== spotIndex
        );
      }
      await match.save();
      return await PadelMatch.find();
    } catch (error) {
      console.error("Error reserving spots:", error.message);
      throw new Error("Error reserving spots: " + error.message);
    }
  },

  deleteMatch: async (matchId) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) throw new Error("Match not found");

      // Remove match from users' matchHistory
      await User.updateMany(
        { username: { $in: match.participants } },
        { $pull: { matchHistory: match._id } }
      );
      console.log(
        "Removed match from matchHistory for participants:",
        match.participants
      );

      await PadelMatch.findByIdAndDelete(matchId);
      return await PadelMatch.find();
    } catch (error) {
      console.error("Error deleting match:", error.message);
      throw new Error("Error deleting match: " + error.message);
    }
  },

  getMatchById: async (matchId) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) throw new Error("Match not found");
      const updatedMatch = {
        ...match.toObject(),
        id: match._id.toString(),
        participants: match.participants || [],
        joinRequests: match.joinRequests || [],
        reservedSpots: match.reservedSpots || [],
        totalSpots: match.totalSpots || 4,
      };
      console.log("getMatchById match:", updatedMatch);
      return updatedMatch;
    } catch (error) {
      console.error("Error fetching match by ID:", error.message);
      throw new Error("Error fetching match: " + error.message);
    }
  },

  getMatchesByPlayer: async (username) => {
    try {
      const matches = await PadelMatch.find({
        $or: [{ participants: username }],
      });
      return matches.map((match) => ({
        ...match.toObject(),
        id: match._id.toString(),
        participants: match.participants || [],
        joinRequests: match.joinRequests || [],
        reservedSpots: match.reservedSpots || [],
        totalSpots: match.totalSpots || 4,
      }));
    } catch (error) {
      console.error("Error fetching matches by player:", error.message);
      throw new Error("Error fetching matches: " + error.message);
    }
  },
};

module.exports = padelMatchService;
