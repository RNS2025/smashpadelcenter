const express = require("express");
const axios = require("axios");
const { passport, generateToken } = require("../config/passport");
const { verifyJWT, checkRole } = require("../middleware/jwt");
const databaseService = require("../Services/databaseService");
const logger = require("../config/logger");
const crypto = require("crypto");
const emailService = require("../Services/emailService");
const User = require("../models/user");

const router = express.Router();

const isProduction = process.env.NODE_ENV === "production";

router.post("/login", (req, res, next) => {
  logger.debug("Login attempt", { username: req.body.username });
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      logger.error("Login error", { error: err.message });
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      logger.warn("Failed login attempt", {
        username: req.body.username,
        reason: info.message,
      });
      return res
        .status(401)
        .json({ error: info.message || "Invalid credentials" });
    }
    const token = generateToken(user);
    // Set HTTP-only cookie for security
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // Only secure in production
      sameSite: isProduction ? "none" : "lax", // "none" for cross-origin in production, "lax" for development
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    logger.info("User logged in successfully", {
      username: user.username,
      role: user.role,
    });
    // Also return token in response for localStorage
    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: { username: user.username, role: user.role },
    });
  })(req, res, next);
});

router.get("/auth/check", verifyJWT, async (req, res) => {
  logger.debug("Auth check request", {
    user: req.user ? req.user._id : "unknown",
  });

  if (process.env.NODE_ENV === "development") {
    axios.interceptors.response.use((response) => {
      if (response.config.url?.includes("/api/v1/auth/check")) {
        return {
          ...response,
          data: {
            isAuthenticated: true,
            user: { id: "mock-user", name: "Mock User" },
          },
        };
      }
      return response;
    });
  }

  try {
    const profile = await databaseService.getProfileWithMatches(req.user._id);
    logger.debug("Auth check successful", { userId: req.user._id });
    res.status(200).json({
      isAuthenticated: true,
      user: profile,
    });
  } catch (error) {
    logger.error("Error fetching user profile", { error: error.message });
    res.status(500).json({ message: error.message });
  }
});

router.get("/users", verifyJWT, checkRole(["admin"]), async (req, res) => {
  try {
    logger.info("Admin fetching users list", { adminUser: req.user.username });
    const users = await databaseService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    logger.error("Error fetching users", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.post(
  "/change-role",
  verifyJWT,
  checkRole(["admin"]),
  async (req, res) => {
    const { username, role } = req.body;
    logger.info("Role change attempt", {
      adminUser: req.user.username,
      targetUser: username,
      newRole: role,
    });
    try {
      const updatedUser = await databaseService.updateUserRole(username, role);
      logger.info("User role updated successfully", {
        username: updatedUser.username,
        newRole: updatedUser.role,
      });
      res.status(200).json({ message: "Role updated", user: updatedUser });
    } catch (err) {
      logger.error("Role update failed", { username, error: err.message });
      res.status(400).json({ error: err.message });
    }
  }
);

router.get("/user-profiles", async (req, res) => {
  try {
    const userProfiles = await databaseService.getAllUserProfiles();
    res.status(200).json(userProfiles);
  } catch (err) {
    logger.error("Error fetching all user profiles", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.get("/role", verifyJWT, (req, res) => {
  logger.debug("User role check", { username: req.user.username });
  res.json({ role: req.user.role });
});

router.get("/username", verifyJWT, (req, res) => {
  logger.debug("Username check", { userId: req.user._id });
  res.status(200).json({ username: req.user.username });
});

router.post("/logout", (req, res) => {
  logger.info("Logout attempt");

  // Clear the auth cookie regardless of whether the user is authenticated
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/", // Important: specify the path
  });

  logger.info("User logged out successfully");
  res.status(200).json({ message: "Logged out successfully" });
});

router.post("/register", async (req, res) => {
  const { username, email } = req.body;
  logger.info("Registration attempt", { username, email });
  try {
    const { username, password, email, fullName } = req.body;
    if (!username || !password) {
      logger.warn("Registration failed - missing fields", { username });
      return res.status(400).json({ error: "All fields are required" });
    }
    const existingUser = await databaseService.findUserByUsername(username);
    if (existingUser) {
      logger.warn("Registration failed - username already exists", {
        username,
      });
      return res.status(400).json({ error: "Username already in use" });
    }
    const newUser = await databaseService.createUser({
      username,
      password,
      email,
      fullName,
      role: "user",
      provider: "local",
    });
    logger.info("User registered successfully", {
      username,
      userId: newUser._id,
    });
    const token = generateToken(newUser);
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // Always use secure for cross-domain
      sameSite: isProduction ? "none" : "lax", // "none" for cross-origin in production, "lax" for development
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.status(201).json({
      message: "Registration successful",
      user: { username: newUser.username, role: newUser.role },
    });
  } catch (err) {
    logger.error("Registration error", { username, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Request password reset - generates token and sends email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    logger.info("Password reset requested", { email });

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Password reset requested for non-existent email", { email });
      // Still return success to prevent email enumeration
      return res.status(200).json({
        message: "If that email exists, a password reset link has been sent",
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Set token and expiration (2 hours)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 7200000; // 2 hours
    await user.save();

    try {
      // Create reset URL
      const frontendURL = isProduction
        ? "https://rns-apps.dk"
        : "http://localhost:5173";
      const resetURL = `${frontendURL}/reset-password/${resetToken}`;

      await emailService.sendPasswordResetEmail(user.email, resetURL);
      logger.info("Password reset email sent", { email: user.email });

      res.status(200).json({
        message:
          "En e-mail er blevet sendt til den angivne adresse med instruktioner om, hvordan du nulstiller din adgangskode.",
      });
    } catch (emailErr) {
      // Email service failed but we still generated a token - provide it directly
      logger.error("Failed to send password reset email", {
        error: emailErr.message,
        email: user.email,
      });

      // For development environment, return the token directly
      if (process.env.NODE_ENV !== "production") {
        return res.status(200).json({
          message:
            "Email service is unavailable. In development mode, use this token:",
          token: resetToken,
          resetUrl: `http://localhost:5173/reset-password/${resetToken}`,
        });
      }

      return res.status(500).json({
        error:
          "Der opstod en fejl ved afsendelse af email. Kontakt venligst support.",
      });
    }
  } catch (err) {
    logger.error("Password reset request error", {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      error: "Der opstod en fejl ved anmodning om nulstilling af adgangskode.",
    });
  }
});

// Reset password using token
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    logger.info("Password reset attempt", { token });

    // Find user with matching token and valid expiration
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      logger.warn("Invalid or expired reset token used", { token });
      return res.status(400).json({
        error:
          "Ugyldigt eller udløbet token. Anmod venligst om en ny nulstilling.",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info("Password reset successful", { username: user.username });

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(
      user.email,
      user.fullName || user.username
    );

    res.status(200).json({
      message:
        "Din adgangskode er blevet nulstillet! Du kan nu logge ind med din nye adgangskode.",
    });
  } catch (err) {
    logger.error("Password reset error", { error: err.message });
    res
      .status(500)
      .json({ error: "Der opstod en fejl ved nulstilling af adgangskoden." });
  }
});

// Verify if reset token is valid
router.get("/reset-password/:token/verify", async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with matching token and valid expiration
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ valid: false });
    }

    res.status(200).json({ valid: true });
  } catch (err) {
    logger.error("Token verification error", { error: err.message });
    res.status(500).json({
      valid: false,
      error: "Der opstod en fejl ved verificering af token.",
    });
  }
});

module.exports = router;
