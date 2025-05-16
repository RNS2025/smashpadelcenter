const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema({
  organisationId: { type: String, required: true },
  eventId: { type: Number, required: true, unique: true },
  eventName: { type: String, required: true },
  eventUrl: { type: String, default: "" },
  club: { type: String, default: "" },
  city: { type: String, default: "" },
  isPremium: { type: Boolean, default: false },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  eventState: { type: Number, default: 0 },
  joinUrl: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

const playerSchema = new mongoose.Schema({
  tournamentId: { type: String, required: true },
  rankedInId: { type: String, required: true },
  name: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

const matchResultSchema = new mongoose.Schema({
  matchId: { type: Number, required: true, unique: true },
  sets: [
    {
      player1: { type: String, required: true },
      player2: { type: String, required: true },
    },
  ],
  tiebreak: {
    player1: { type: String },
    player2: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Tournament =
  mongoose.models.Tournament || mongoose.model("Tournament", tournamentSchema);
const Player = mongoose.models.Player || mongoose.model("Player", playerSchema);
const MatchResult =
  mongoose.models.MatchResult ||
  mongoose.model("MatchResult", matchResultSchema);

module.exports = { Tournament, Player, MatchResult };
