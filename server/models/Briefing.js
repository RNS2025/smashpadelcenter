const mongoose = require("mongoose");

const BriefingSchema = new mongoose.Schema({
    body: { type: String, required: true },
});

module.exports = mongoose.model("Briefing", BriefingSchema);