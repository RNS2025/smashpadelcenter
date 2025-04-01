const mongoose = require("mongoose");

// Define the check-in schema
const CheckInSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: String,
      required: true,
    },
    rowId: {
      type: String,
      required: true,
    },
    playerId: {
      type: String,
      required: true,
    },
    playerName: {
      type: String,
      required: true,
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields instead of custom timestamp
);

// Create a compound index for quick lookups
CheckInSchema.index(
  { tournamentId: 1, rowId: 1, playerId: 1 },
  { unique: true }
);

// Create the model
const CheckIn = mongoose.model("CheckIn", CheckInSchema);

module.exports = CheckIn;
