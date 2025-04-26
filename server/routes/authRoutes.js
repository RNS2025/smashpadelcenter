const express = require("express");
const passport = require("../config/passport");
const user = require("../config/roles");
const databaseService = require("../Services/databaseService");
const logger = require("../config/logger"); // Add logger import

const router = express.Router();

const ensureSession = (req, res, next) => {
  if (!req.isAuthenticated()) {
    logger.warn("Unauthorized access attempt", { path: req.originalUrl });
    return res.status(401).json({ error: "Authentication failed" });
  }
  next();
};

router.post("/login", (req, res, next) => {
  logger.debug("Login attempt", { username: req.body.username });
  passport.authenticate("local", (err, user, info) => {
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
    req.logIn(user, (err) => {
      if (err) {
        logger.error("Session creation error", { error: err.message });
        return res.status(500).json({ error: err.message });
      }
      logger.info("User logged in successfully", {
        username: user.username,
        role: user.role,
      });
      return res.status(200).json({
        message: "Login successful",
        user: { username: user.username, role: user.role },
      });
    });
  })(req, res, next);
});

router.get(
  "/auth/google",
  (req, res, next) => {
    logger.debug("Google OAuth login attempt");
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/auth/check", async (req, res) => {
  logger.debug("Auth check request");
  if (req.isAuthenticated()) {
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
  } else {
    logger.debug("Auth check - user not authenticated");
    res.status(200).json({ isAuthenticated: false, user: null });
  }
});

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  ensureSession,
  (req, res) => {
    logger.info("Google OAuth login successful", {
      username: req.user.username,
    });
    res.redirect(`${process.env.FRONTEND_URL}/smashpadelcenter/hjem`);
  }
);

router.get("/users", async (req, res) => {
  try {
    if (!req.user) {
      logger.warn("Unauthorized users list access attempt");
      return res
        .status(401)
        .json({ message: "Unauthorized - No user logged in" });
    }
    if (req.user.role !== "admin") {
      logger.warn("Forbidden users list access", {
        username: req.user.username,
        role: req.user.role,
      });
      return res.status(403).json({ message: "Forbidden - Admins only" });
    }

    logger.info("Admin fetching users list", { adminUser: req.user.username });
    const users = await databaseService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    logger.error("Error fetching users", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.post("/change-role", user.can("access admin page"), async (req, res) => {
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
});

router.get("/role", (req, res) => {
  try {
    if (!req.user) {
      logger.warn("Unauthorized role check attempt");
      return res
        .status(401)
        .json({ message: "Unauthorized - No user logged in" });
    }
    logger.debug("User role check", { username: req.user.username });
    res.json({ role: req.user.role });
  } catch (err) {
    logger.error("Error in role check", { error: err.message });
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/username", (req, res) => {
  try {
    if (!req.user) {
      logger.warn("Unauthorized username check attempt");
      return res
        .status(401)
        .json({ message: "Unauthorized - No user logged in" });
    }
    logger.debug("Username check", { userId: req.user._id });
    res.status(200).json({ username: req.user.username });
  } catch (err) {
    logger.error("Error in username check", { error: err.message });
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/logout", (req, res) => {
  const username = req.user?.username;
  logger.info("Logout attempt", { username });

  req.logout((err) => {
    if (err) {
      logger.error("Error logging out", { username, error: err.message });
      return res.status(500).json({ message: "Internal Server Error" });
    }
    req.session.destroy((err) => {
      if (err) {
        logger.error("Error destroying session", { error: err.message });
        return res.status(500).json({ message: "Internal Server Error" });
      }
      logger.info("User logged out successfully", { username });
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
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

    req.login(newUser, (err) => {
      if (err) {
        logger.error("Error during auto-login after registration", {
          username,
          error: err.message,
        });
        return res.status(500).json({ error: err.message });
      }
      logger.info("New user logged in automatically", { username });
      return res.status(201).json({
        message: "Registration successful",
        user: { username: newUser.username, role: newUser.role },
      });
    });
  } catch (err) {
    logger.error("Registration error", { username, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
