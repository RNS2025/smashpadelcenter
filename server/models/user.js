const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
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
    sparse: true, // Allows multiple null/undefined values
  },
  role: {
    type: String,
    enum: ["user", "Admin", "Træner"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Drop existing providerId index if it exists
userSchema.indexes().forEach((index) => {
  if (index.key && index.key.providerId && index.name === "providerId_1") {
    try {
      userSchema.dropIndex(index.name);
      console.log(`Dropped index: ${index.name}`);
    } catch (err) {
      console.error(`Error dropping index ${index.name}: ${err.message}`);
    }
  }
});

// Create a sparse index for providerId
userSchema.index({ providerId: 1 }, { sparse: true, unique: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.provider === "local") {
    this.password = await bcrypt.hash(this.password, 10);
  }
  // Ensure providerId is undefined for local users
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
