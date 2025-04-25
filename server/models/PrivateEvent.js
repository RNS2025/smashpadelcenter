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
    required: true,
  },
  eventFormat: {
    type: String,
    required: true,
  },
  totalSpots: {
    type: Number,
    required: true,
    default: 4,
  },
  courtBooked: {
    type: Boolean,
    default: false,
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
