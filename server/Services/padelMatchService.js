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

  joinMatch: async (matchId, username) => {
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
  },

  confirmJoin: async (matchId, username) => {
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
  },

  createMatch: async (matchData) => {
    const newMatch = new PadelMatch({
      ...matchData,
      participants: [matchData.username, ...(matchData.participants || []).filter(p => p !== matchData.username)],

      joinRequests: matchData.joinRequests || [],
      reservedSpots: matchData.reservedSpots || [],
      totalSpots: matchData.totalSpots || 4,
    });

    const savedMatch = await newMatch.save();

    return {
      ...savedMatch.toObject(),
      id: savedMatch._id.toString(),
    };
  },


  getMatchById: async (matchId) => {
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
