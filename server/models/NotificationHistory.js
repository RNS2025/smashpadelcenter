const mongoose = require("mongoose");

const notificationHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  notificationId: {
    type: String,
    required: true,
    unique: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "NotificationHistory",
  notificationHistorySchema
);
