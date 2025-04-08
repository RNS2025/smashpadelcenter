// models/PadelMatch.js
const mongoose = require("mongoose");

const padelMatchSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  level: {
    type: Number,
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
    type: [Number],
    default: [0], // Spot 0 is reserved for the creator by default
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
    type: Date,
    required: true,
  },
  courtBooked: {
    type: Boolean,
    default: false,
  },
});

const PadelMatch = mongoose.model("PadelMatch", padelMatchSchema);

module.exports = PadelMatch;
