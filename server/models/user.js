const mongoose = require("mongoose");
const argon2 = require("argon2");

// Define User Schema
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await argon2.hash(this.password);
    next();
  } catch (error) {
    return next(error);
  }
});

// Compare entered password with stored hashed password
UserSchema.methods.comparePassword = async function (password) {
  try {
    return await argon2.verify(this.password, password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Create User model
const User = mongoose.model("User", UserSchema);

module.exports = User;
