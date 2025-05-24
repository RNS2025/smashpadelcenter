const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const logger = require("../config/logger"); // Import Winston logger

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },
    provider: {
      type: String,
      required: true,
      enum: ["local", "google", "facebook", "github"],
      default: "local",
    },
    providerId: {
      type: String,
      required: function () {
        return this.provider !== "local";
      },
    },
    role: {
      type: String,
      enum: ["user", "admin", "Træner", "preRelease"],
      default: "user",
    },
    fullName: {
      type: String,
      trim: true,
      default: "",
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
      default: "Begge",
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
    stats: {
      matches: {
        type: Number,
        default: 0,
      },
      wins: {
        type: Number,
        default: 0,
      },
      losses: {
        type: Number,
        default: 0,
      },
      draws: {
        // Added draws field
        type: Number,
        default: 0,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    groups: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        members: [{ type: String, required: true }],
      },
    ],
    rankedInId: {
      type: String,
      trim: true,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    autoIndex: false, // Disable auto-indexing for production
  }
);

// Create a sparse index for providerId
userSchema.index({ providerId: 1 }, { sparse: true, unique: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.provider === "local") {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (this.provider === "local") {
    this.providerId = undefined;
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
