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

  updateMatch: async (matchId, matchData) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) throw new Error("Match not found");
      // Update match properties
      Object.assign(match, matchData);
      await match.save();
      const updatedMatch = {
        ...match.toObject(),
        id: match._id.toString(),
        participants: match.participants || [],
        joinRequests: match.joinRequests || [],
        reservedSpots: match.reservedSpots || [],
        totalSpots: match.totalSpots || 4,
      };
      logger.debug("PadelMatchService: Match updated successfully", {
        matchId,
        matchData,
      });
      return updatedMatch;
    } catch (error) {
      logger.error("PadelMatchService: Error updating match", {
        matchId,
        matchData,
        error: error.message,
      });
      throw new Error("Error updating match: " + error.message);
    }
  },

  removePlayer: async (matchId, username) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) throw new Error("Match not found");
      if (!match.participants.includes(username)) {
        throw new Error("User not a participant in this match");
      }
      // Remove the user from participants
      match.participants = match.participants.filter(
        (player) => player !== username
      );

      // Remove the user from invitedPlayers if present
      match.invitedPlayers = match.invitedPlayers.filter(
        (player) => player !== username
      );

      // Remove the user from joinRequests and reservedSpots if present
      match.joinRequests = match.joinRequests.filter(
        (player) => player !== username
      );
      match.reservedSpots = match.reservedSpots.filter(
        (spot) => spot !== username
      );
      await match.save();
      const updatedMatch = {
        ...match.toObject(),
        id: match._id.toString(),
        participants: match.participants || [],
        joinRequests: match.joinRequests || [],
        reservedSpots: match.reservedSpots || [],
        totalSpots: match.totalSpots || 4,
      };
      logger.debug("PadelMatchService: Player removed from match", {
        matchId,
        username,
      });
      return updatedMatch;
    } catch (error) {
      logger.error("PadelMatchService: Error removing player from match", {
        matchId,
        username,
        error: error.message,
      });
      throw new Error("Error removing player: " + error.message);
    }
  },

  removeReservedPlayer: async (matchId, username) => {
    const match = await PadelMatch.findById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    match.reservedSpots = match.reservedSpots.filter(
      (spot) => spot.name !== username
    );

    await match.save();
    return match;
  },

  rejectJoin: async (matchId, username) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) throw new Error("Match not found");

      // Check if user exists in any list
      const userExists =
        match.invitedPlayers.includes(username) ||
        match.joinRequests.includes(username);

      if (!userExists) {
        throw new Error("User not found in match");
      }

      // Remove the user from invitedPlayers if present
      if (match.invitedPlayers.includes(username)) {
        match.invitedPlayers = match.invitedPlayers.filter(
          (player) => player !== username
        );
      }

      // Remove the user from joinRequests if present
      if (match.joinRequests.includes(username)) {
        match.joinRequests = match.joinRequests.filter(
          (player) => player !== username
        );
      }

      await match.save();

      const updatedMatch = {
        ...match.toObject(),
        id: match._id.toString(),
        participants: match.participants || [],
        joinRequests: match.joinRequests || [],
        reservedSpots: match.reservedSpots || [],
        invitedPlayers: match.invitedPlayers || [],
        totalSpots: match.totalSpots || 4,
      };
      logger.debug("PadelMatchService: User rejected invitation", {
        matchId,
        username,
      });
      return updatedMatch;
    } catch (error) {
      logger.error("PadelMatchService: Error rejecting invitation", {
        matchId,
        username,
        error: error.message,
      });
      throw new Error("Error rejecting invitation: " + error.message);
    }
  },

  acceptJoin: async (matchId, username) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) throw new Error("Match not found");

      if (!match.invitedPlayers.includes(username)) {
        throw new Error("No invitation found for this user");
      }

      // Check if match is full
      const nonOwnerParticipants = match.participants.filter(
        (p) => p !== match.username
      );
      if (nonOwnerParticipants.length + match.reservedSpots.length >= 3) {
        throw new Error("Match is full");
      }

      // Remove from invitedPlayers and add to participants
      match.invitedPlayers = match.invitedPlayers.filter(
        (player) => player !== username
      );
      match.participants.push(username);
      await match.save();

      // Update matchHistory for the user
      await User.updateOne(
        { username },
        { $push: { matchHistory: match._id } }
      );
      logger.debug("Updated matchHistory for user:", { username });

      const updatedMatch = {
        ...match.toObject(),
        id: match._id.toString(),
        participants: match.participants || [],
        joinRequests: match.joinRequests || [],
        reservedSpots: match.reservedSpots || [],
        invitedPlayers: match.invitedPlayers || [],
        totalSpots: match.totalSpots || 4,
      };
      logger.debug("PadelMatchService: User accepted invitation", {
        matchId,
        username,
      });
      return updatedMatch;
    } catch (error) {
      logger.error("PadelMatchService: Error accepting invitation", {
        matchId,
        username,
        error: error.message,
      });
      throw new Error("Error accepting invitation: " + error.message);
    }
  },

  invitedPlayers: async (matchId, usernames) => {
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
        (username) => !match.participants.includes(username)
      );

      if (newInviteRequests.length === 0) {
        throw new Error("All users are already participants or invited");
      }

      // Check if the match creator is trying to invite themselves
      if (newInviteRequests.includes(match.username)) {
        throw new Error("Match creator cannot invite themselves");
      }

      // Check if the match is already full (excluding creator, max 3 additional players)
      if (match.participants.length >= 4) {
        throw new Error("Match is already full");
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
      match.invitedPlayers.push(...newInviteRequests);
      await match.save();
      const updatedMatch = {
        ...match.toObject(),
        id: match._id.toString(),
        participants: match.participants || [],
        joinRequests: match.joinRequests || [],
        reservedSpots: match.reservedSpots || [],
        invitedPlayers: match.invitedPlayers || [],
        totalSpots: match.totalSpots || 4,
      };
      console.log("invitedPlayers updated match:", updatedMatch);
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

  playerCancelJoinMatch: async (matchId, username) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) throw new Error("Match not found");
      if (!match.joinRequests.includes(username)) {
        throw new Error("No join request found for this user");
      }
      match.joinRequests = match.joinRequests.filter((req) => req !== username);
      await match.save();
      const updatedMatch = {
        ...match.toObject(),
        id: match._id.toString(),
        participants: match.participants || [],
        joinRequests: match.joinRequests || [],
        reservedSpots: match.reservedSpots || [],
        totalSpots: match.totalSpots || 4,
      };
      console.log("playerCancelJoinMatch updated match:", updatedMatch);
      return updatedMatch;
    } catch (error) {
      console.error("Error canceling join request:", error.message);
      throw new Error("Error canceling join request: " + error.message);
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

  submitMatchResult: async (matchId, matchResult) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) {
        throw new Error("Match not found");
      }

      if (match.team1Sets !== undefined && match.team2Sets !== undefined) {
        throw new Error("Error in match result");
      }

      Object.assign(match, matchResult);

      await match.save();
      return match;
    } catch (error) {
      console.error("Error submitting match result:", error.message);
      throw new Error("Error submitting match result: " + error.message);
    }
  },

  confirmMatchResult: async (matchId, confirmResukt) => {
    try {
      const match = await PadelMatch.findById(matchId);
      if (!match) {
        throw new Error("Match not found");
      }

      if (match.team1Sets === undefined || match.team2Sets === undefined) {
        throw new Error(
          "Match result (sets) not submitted yet or error in match result"
        );
      }

      Object.assign(match, confirmResukt);

      let winningUsernames = [];
      let losingUsernames = [];
      let isDraw = false;

      if (match.team1Sets > match.team2Sets) {
        winningUsernames = Array.isArray(match.team1) ? [...match.team1] : [];
        losingUsernames = Array.isArray(match.team2) ? [...match.team2] : [];
        match.winningTeam = winningUsernames;
        match.losingTeam = losingUsernames;
        match.isDraw = false;
      } else if (match.team2Sets > match.team1Sets) {
        winningUsernames = Array.isArray(match.team2) ? [...match.team2] : [];
        losingUsernames = Array.isArray(match.team1) ? [...match.team1] : [];
        match.winningTeam = winningUsernames;
        match.losingTeam = losingUsernames;
        match.isDraw = false;
      } else {
        isDraw = true;
        match.isDraw = true;
        match.winningTeam = [];
        match.losingTeam = [];
      }
      match.status = "completed";

      // Update stats for all participants
      if (Array.isArray(match.participants)) {
        for (const username of match.participants) {
          const user = await User.findOne({ username: username });
          if (user) {
            user.stats = user.stats || {};
            user.stats.wins = user.stats.wins || 0;
            user.stats.losses = user.stats.losses || 0;
            user.stats.draws = user.stats.draws || 0;
            user.stats.matches = user.stats.matches || 0;

            if (isDraw) {
              user.stats.draws += 1;
            } else if (winningUsernames.includes(username)) {
              user.stats.wins += 1;
              user.stats.matches += 1;
            } else if (losingUsernames.includes(username)) {
              if (
                (match.team1.includes(username) &&
                  losingUsernames.every((u) => match.team1.includes(u))) ||
                (match.team2.includes(username) &&
                  losingUsernames.every((u) => match.team2.includes(u)))
              ) {
                user.stats.losses += 1;
                user.stats.matches += 1;
              } else if (!winningUsernames.includes(username)) {
                logger.info(
                  `User ${username} in match ${matchId} was not in winning or clearly defined losing team. W/L stats not updated.`
                );
              }
            }
            await user.save();
            logger.info(
              `Stats updated for user ${username} from match ${matchId}`
            );
          } else {
            logger.warn(
              `User ${username} not found during stat update for match ${matchId}`
            );
          }
        }
      } else {
        logger.error(
          `match.participants is not an array for match ${matchId}. Cannot update stats.`
        );
      }

      await match.save();
      // Return a plain object if other parts of the system expect it, or the Mongoose document
      return match.toObject ? match.toObject() : match;
    } catch (error) {
      logger.error(`Error confirming match result for matchId ${matchId}:`, {
        message: error.message,
        stack: error.stack,
      });
      // It's good practice to re-throw a generic error or the specific error if the caller needs to handle it
      throw new Error("Error confirming match result: " + error.message);
    }
  },
};

module.exports = padelMatchService;
