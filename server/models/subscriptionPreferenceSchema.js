// models/SubscriptionPreference.js
const mongoose = require("mongoose");

const subscriptionPreferenceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  preferences: {
    updates: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    events: { type: Boolean, default: false },
    promotions: { type: Boolean, default: false },
    makkerbors: { type: Boolean, default: false },
    rangliste: { type: Boolean, default: false },
    nyheder: { type: Boolean, default: false },
    turneringer: { type: Boolean, default: false },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "SubscriptionPreference",
  subscriptionPreferenceSchema
);
