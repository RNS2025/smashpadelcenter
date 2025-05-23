const mongoose = require("mongoose");
const crypto = require("crypto");

const privateEventSchema = new mongoose.Schema({
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
    required: false,
  },
  eventFormat: {
    type: String,
    required: false,
  },
  totalSpots: {
    type: Number,
    required: true,
    default: 4,
  },
  price: {
    type: Number,
    required: false,
  },
  courtBooked: {
    type: Boolean,
    default: false,
  },
  courtNames: {
    type: [String],
    default: [],
  },
  doorCode: {
    type: String,
    required: false,
  },
  eventDateTime: {
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
  location: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: false,
  },
  openRegistration: {
    type: Boolean,
    default: true,
  },
  participants: {
    type: [String],
    default: [],
  },
  joinRequests: {
    type: [String],
    default: [],
  },
  invitedPlayers: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
  accessUrl: {
    type: String,
    required: false,
  },
});

const PrivateEvent = mongoose.model("PrivateEvent", privateEventSchema);

module.exports = PrivateEvent;
