// models/PushSubscription.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PushSubscriptionSchema = new Schema({
  username: {
    type: String,
    required: true,
    index: true,
  },
  subscription: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure we have an index on username for fast lookups
PushSubscriptionSchema.index({ username: 1 });

// Ensure only one subscription per username
PushSubscriptionSchema.statics.updateOrCreateSubscription = async function (
  username,
  subscription
) {
  return this.findOneAndUpdate(
    { username },
    { username, subscription, createdAt: new Date() },
    { upsert: true, new: true }
  );
};

const PushSubscription = mongoose.model(
  "PushSubscription",
  PushSubscriptionSchema
);

module.exports = PushSubscription;
