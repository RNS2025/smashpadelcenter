const mongoose = require("mongoose");
const User = require("../models/user");
const UserProfile = require("../models/UserProfile");
const PadelMatch = require("../models/PadelMatch");

const userProfileService = {
  getProfileWithMatches: async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    let profile = await UserProfile.findOne({ user: userId }).populate(
      "matchHistory"
    );
    if (!profile) {
      // Create a default profile if none exists
      profile = await userProfileService.createUserProfile(user.username, {
        email: "placeholder@example.com",
        fullName: "",
        phoneNumber: "",
        profilePictureUrl: "/api/placeholder/150/150",
        skillLevel: 1,
        position: "both",
        playingStyle: "",
        equipment: "",
      });
    }

    const matches = await PadelMatch.find({
      participants: user.username,
    });

    const now = new Date();
    const pastMatches = matches
      .filter((m) => new Date(m.matchDateTime) <= now)
      .map((m) => ({
        id: m._id.toString(),
        date: m.matchDateTime.toISOString(),
        opponent:
          m.participants.filter((p) => p !== user.username).join(", ") ||
          "Unknown",
        score: m.score || "TBD",
        result: m.result || "unknown",
      }));

    const stats = await userProfileService.getUserStats(userId);

    return {
      id: profile._id.toString(),
      fullName: profile.fullName || "",
      username: user.username,
      email: profile.email,
      phoneNumber: profile.phoneNumber || "",
      profilePictureUrl:
        profile.profilePictureUrl || "/api/placeholder/150/150",
      skillLevel: profile.skillLevel || 1,
      position: profile.position || "both",
      playingStyle: profile.playingStyle || "",
      equipment: profile.equipment || "",
      role: user.role || "user",
      pastMatches,
      stats,
    };
  },

  getUserStats: async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const matches = await PadelMatch.find({
      participants: user.username,
      result: { $in: ["win", "loss"] },
    });

    const wins = matches.filter((m) => m.result === "win").length;
    const losses = matches.filter((m) => m.result === "loss").length;
    const totalMatches = wins + losses;

    return {
      matches: totalMatches,
      wins,
      losses,
    };
  },

  createUserProfile: async (username, profileData) => {
    const user = await User.findOne({ username });
    if (!user) throw new Error("User not found");

    const existing = await UserProfile.findOne({ user: user._id });
    if (existing) throw new Error("Profile already exists");

    const newProfile = await UserProfile.create({
      user: user._id,
      ...profileData,
    });

    return newProfile;
  },

  updateUserProfile: async (username, updateData) => {
    const user = await User.findOne({ username });
    if (!user) throw new Error("User not found");

    const profile = await UserProfile.findOneAndUpdate(
      { user: user._id },
      { $set: updateData },
      { new: true }
    );

    if (!profile) throw new Error("Profile not found");

    return {
      id: profile._id.toString(),
      fullName: profile.fullName || "",
      username: user.username,
      email: profile.email,
      phoneNumber: profile.phoneNumber || "",
      profilePictureUrl:
        profile.profilePictureUrl || "/api/placeholder/150/150",
      skillLevel: profile.skillLevel || 1,
      position: profile.position || "both",
      playingStyle: profile.playingStyle || "",
      equipment: profile.equipment || "",
      role: user.role || "user",
      pastMatches: [],
      stats: await userProfileService.getUserStats(user._id),
    };
  },

  getProfileByUsername: async (username) => {
    const user = await User.findOne({ username });
    if (!user) throw new Error("User not found");

    return await userProfileService.getProfileWithMatches(user._id);
  },
};

module.exports = userProfileService;
