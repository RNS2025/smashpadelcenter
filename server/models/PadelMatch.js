const mongoose = require("mongoose");

const reservedSpotSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    deadline: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const padelMatchSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  participants: {
    type: [String],
    default: [],
  },
  joinRequests: {
    type: [String],
    default: [],
  },
  reservedSpots: {
    type: [reservedSpotSchema],
    default: [],
  },
  invitedPlayers: {
    type: [String],
    default: [],
  },
  totalSpots: {
    type: Number,
    default: 4,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  matchDateTime: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  courtBooked: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String,
    required: true,
  },
  matchType: {
    type: String,
    required: true,
  },
  deadline: {
    type: String,
    required: false,
  },
  score: {
    type: String,
    required: false,
  },
  winningTeam: {
    type: [String],
    default: [],
  },
  losingTeam: {
    type: [String],
    default: [],
  },
  result: {
    type: String,
    enum: ["win", "loss", "pending", "unknown"],
    default: "pending",
  },
});

// Transform _id to id in JSON responses
padelMatchSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    // Ensure createdAt is returned as ISO string
    ret.createdAt = ret.createdAt.toISOString();
    return ret;
  },
});

const PadelMatch = mongoose.model("PadelMatch", padelMatchSchema);

module.exports = PadelMatch;
