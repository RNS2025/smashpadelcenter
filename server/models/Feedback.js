const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
    page: { type: String, required: true },
    body: { type: String, required: true },
    username: { type: String, required: true },
    date: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
});

module.exports = mongoose.model("Feedback", FeedbackSchema);