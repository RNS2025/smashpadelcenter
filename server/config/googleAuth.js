// Replace your passport Google OAuth configuration with this simpler approach
// In your config folder, create a file called googleAuth.js

const { google } = require("googleapis");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

// Create an OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NODE_ENV === "production"
    ? "https://rns-apps.dk/api/v1/auth/google/callback"
    : "http://localhost:3001/api/v1/auth/google/callback"
);

// Generate authorization URL
const getAuthUrl = () => {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", // Forces consent screen to ensure refresh token
  });
};

// Exchange code for tokens and get user profile
const getGoogleUser = async (code) => {
  try {
    // Exchange authorization code for tokens
    logger.info("Exchanging auth code for tokens");
    const { tokens } = await oauth2Client.getToken(code);

    // Set credentials
    oauth2Client.setCredentials(tokens);

    // Get user info
    logger.info("Fetching Google user info");
    const people = google.people({ version: "v1", auth: oauth2Client });
    const userInfo = await people.people.get({
      resourceName: "people/me",
      personFields: "names,emailAddresses",
    });

    // Extract relevant info
    const email = userInfo.data.emailAddresses?.[0]?.value;
    const name = userInfo.data.names?.[0]?.displayName;
    const googleId = userInfo.data.resourceName.replace("people/", "");

    logger.info("Google profile fetched successfully", {
      name,
      email,
      googleId,
    });

    return { email, name, googleId };
  } catch (error) {
    logger.error("Error getting Google user", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

// Find or create user in database
const findOrCreateUser = async (googleProfile) => {
  try {
    // Look for existing user
    logger.info("Looking for existing Google user", {
      googleId: googleProfile.googleId,
    });
    let user = await User.findOne({
      providerId: googleProfile.googleId,
      provider: "google",
    });

    if (!user) {
      logger.info("No existing user found, creating new user", {
        email: googleProfile.email,
      });

      // Create username from name or email
      const username =
        googleProfile.name?.replace(/\s+/g, "") ||
        googleProfile.email.split("@")[0];

      // Create new user
      user = new User({
        provider: "google",
        providerId: googleProfile.googleId,
        username,
        email: googleProfile.email,
        role: "user",
      });

      await user.save();
      logger.info("New Google user created", { username });
    } else {
      logger.info("Existing user found", { username: user.username });
    }

    return user;
  } catch (error) {
    logger.error("Error finding/creating user", {
      email: googleProfile.email,
      error: error.message,
    });
    throw error;
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "1d" }
  );
};

module.exports = {
  getAuthUrl,
  getGoogleUser,
  findOrCreateUser,
  generateToken,
};
