const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

passport.use(
  new LocalStrategy(async function (username, password, done) {
    try {
      const user = await User.findOne({ username, provider: "local" });
      if (!user) {
        return done(null, false, {
          message: "Incorrect username or not a local account.",
        });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return done(null, false, { message: "Incorrect password." });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://rns-apps.dk/api/v1/auth/google/callback",
      proxy: true, // This helps when behind a proxy like Render
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const logger = require("../config/logger");
        logger.info("Google authentication callback triggered", {
          profileId: profile.id,
          displayName: profile.displayName,
        });

        // Search for existing user
        let user = await User.findOne({
          providerId: profile.id,
          provider: "google",
        });

        if (!user) {
          logger.info("Creating new user from Google profile", {
            profileId: profile.id,
          });

          const email =
            profile.emails?.[0]?.value || `${profile.id}@google.com`;
          const username =
            profile.displayName?.replace(/\s+/g, "") || email.split("@")[0];

          user = new User({
            provider: "google",
            providerId: profile.id,
            username,
            email,
            role: "user",
          });
          await user.save();
          logger.info("New Google user created", { username });
        } else {
          logger.info("Existing Google user found", {
            username: user.username,
          });
        }

        return done(null, user);
      } catch (err) {
        logger.error("Error in Google authentication:", {
          error: err.message,
          stack: err.stack,
        });
        return done(err);
      }
    }
  )
);

// Remove serialize/deserialize as they are session-specific
// Instead, create a function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "1d" }
  );
};

module.exports = { passport, generateToken };
