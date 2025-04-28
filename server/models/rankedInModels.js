const mongoose = require("mongoose");

const TournamentSchema = new mongoose.Schema({
  organisationId: String,
  eventId: Number,
  eventName: String,
  eventUrl: String,
  club: String,
  city: String,
  isPremium: Boolean,
  startDate: String,
  endDate: String,
  eventState: Number,
  joinUrl: String,
  updatedAt: { type: Date, default: Date.now },
});

const PlayerSchema = new mongoose.Schema({
  tournamentId: Number,
  rankedInId: String,
  name: String,
  firstName: String,
  lastName: String,
  updatedAt: { type: Date, default: Date.now },
});

const LeagueSchema = new mongoose.Schema({
  organisationId: String,
  id: Number,
  name: String,
  startDate: String,
  endDate: String,
  updatedAt: { type: Date, default: Date.now },
});

const TeamSchema = new mongoose.Schema({
  leagueId: Number,
  id: Number,
  name: String,
  organisationId: String,
  updatedAt: { type: Date, default: Date.now },
});

const MatchSchema = new mongoose.Schema({
  matchId: Number,
  tournamentId: Number,
  leagueId: Number,
  teamId: Number,
  playerId: String,
  round: Number,
  date: String,
  courtName: String,
  durationMinutes: Number,
  challenger: {
    id: String,
    firstPlayer: Object,
    secondPlayer: Object,
  },
  challenged: {
    id: String,
    firstPlayer: Object,
    secondPlayer: Object,
  },
  score: String,
  isPlayed: Boolean,
  winnerParticipantId: Number,
  matchType: String,
  updatedAt: { type: Date, default: Date.now },
});

const RankedInPlayerSearchResultSchema = new mongoose.Schema({
  participantId: { type: Number, required: true },
  participantName: { type: String, required: true },
  points: { type: Number, required: true },
  standing: { type: Number, required: true },
  participantUrl: { type: String, required: true },
});


// Add indexes for performance
TournamentSchema.index({ organisationId: 1, isFinished: 1 });
PlayerSchema.index({ tournamentId: 1 });
LeagueSchema.index({ organisationId: 1 });
TeamSchema.index({ organisationId: 1, leagueId: 1 });
MatchSchema.index({ tournamentId: 1, leagueId: 1, teamId: 1 });

module.exports = {
  Tournament: mongoose.model("Tournament", TournamentSchema),
  Player: mongoose.model("Player", PlayerSchema),
  League: mongoose.model("League", LeagueSchema),
  Team: mongoose.model("Team", TeamSchema),
  Match: mongoose.model("Match", MatchSchema),
    RankedInPlayerSearchResult: mongoose.model("RankedInPlayerSearchResult", RankedInPlayerSearchResultSchema),
};
