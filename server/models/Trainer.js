const mongoose = require("mongoose");

const TrainerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    image: { type: String, required: true },
    bio: { type: String, required: true },
    availability: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trainer", TrainerSchema);
