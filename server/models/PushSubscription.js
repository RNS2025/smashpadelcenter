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

// Allow multiple subscriptions per user (username + endpoint unique)
PushSubscriptionSchema.index(
  { username: 1, "subscription.endpoint": 1 },
  { unique: true }
);

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

// Add a method to add a new subscription for a user (if not already present)
PushSubscriptionSchema.statics.addSubscription = async function (
  username,
  subscription
) {
  return this.findOneAndUpdate(
    { username, "subscription.endpoint": subscription.endpoint },
    { username, subscription, createdAt: new Date() },
    { upsert: true, new: true }
  );
};

// Add a method to get all subscriptions for a user
PushSubscriptionSchema.statics.getAllForUser = async function (username) {
  return this.find({ username });
};

// Add a method to remove a specific subscription for a user
PushSubscriptionSchema.statics.removeSubscription = async function (
  username,
  endpoint
) {
  return this.deleteOne({ username, "subscription.endpoint": endpoint });
};

const PushSubscription = mongoose.model(
  "PushSubscription",
  PushSubscriptionSchema
);

module.exports = PushSubscription;
