// services/padelMatchService.js
const PadelMatch = require("../models/PadelMatch");

const padelMatchService = {
  getAllMatches: async () => {
    const matches = await PadelMatch.find();
    return matches.map((match) => ({
      ...match.toObject(),
      id: match._id,
    }));
  },

  createMatch: async (matchData) => {
    const newMatch = new PadelMatch(matchData);
    return await newMatch.save();
  },

  joinMatch: async (matchId, username) => {
    const match = await PadelMatch.findById(matchId);
    if (!match) throw new Error("Match not found");
    if (
      match.participants.includes(username) ||
      match.joinRequests.includes(username)
    ) {
      throw new Error("User already in participants or join requests");
    }
    if (
      match.participants.length + match.reservedSpots.length >=
      match.totalSpots
    ) {
      throw new Error("Match is full");
    }
    match.joinRequests.push(username);
    await match.save();
    return await PadelMatch.find(); // Return updated list
  },

  confirmJoin: async (matchId, username) => {
    const match = await PadelMatch.findById(matchId);
    if (!match) throw new Error("Match not found");
    if (!match.joinRequests.includes(username)) {
      throw new Error("No join request found for this user");
    }
    if (
      match.participants.length + match.reservedSpots.length >=
      match.totalSpots
    ) {
      throw new Error("Match is full");
    }
    match.joinRequests = match.joinRequests.filter((req) => req !== username);
    match.participants.push(username);
    await match.save();
    return await PadelMatch.find(); // Return updated list
  },

  reserveSpots: async (matchId, spotIndex, reserve) => {
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
    return await PadelMatch.find(); // Return updated list
  },

  deleteMatch: async (matchId) => {
    const match = await PadelMatch.findByIdAndDelete(matchId);
    if (!match) throw new Error("Match not found");
    return await PadelMatch.find(); // Return updated list
  },
};

module.exports = padelMatchService;
