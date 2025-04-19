const mongoose = require("mongoose");
const User = require("./user"); // Assuming user model is available

const TrainerSchema = new mongoose.Schema(
  {
    username: { type: String, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    image: { type: String, required: true },
    bio: { type: String, required: true },
    availability: [
      {
        date: { type: Date, required: true },
        timeSlots: [
          {
            startTime: { type: String, required: true },
            isBooked: { type: Boolean, default: false },
            bookedBy: { type: String, ref: "User" },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

// Booking Schema
const BookingSchema = new mongoose.Schema(
  {
    username: { type: String, ref: "User", required: true },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
      required: true,
    },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const TrainerMessageSchema = new mongoose.Schema(
  {
    senderUsername: { type: String, ref: "User", required: true },
    trainerUsername: { type: String, ref: "Trainer", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = {
  Trainer: mongoose.model("Trainer", TrainerSchema),
  Booking: mongoose.model("Booking", BookingSchema),
  TrainerMessage: mongoose.model("TrainerMessage", TrainerMessageSchema),
};
