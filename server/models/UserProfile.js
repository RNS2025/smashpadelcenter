const mongoose = require("mongoose");

const UserProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    profilePictureUrl: {
      type: String,
      default: "/api/placeholder/150/150",
    },
    skillLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    position: {
      type: String,
      enum: ["left", "right", "both"],
      default: "both",
    },
    playingStyle: {
      type: String,
      trim: true,
      default: "",
    },
    equipment: {
      type: String,
      trim: true,
      default: "",
    },
    matchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PadelMatch",
      },
    ],
  },
  { timestamps: true }
);

const UserProfile = mongoose.model("UserProfile", UserProfileSchema);

module.exports = UserProfile;
