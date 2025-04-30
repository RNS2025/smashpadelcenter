const express = require("express");
const { passport, generateToken } = require("../config/passport");
const { verifyJWT, checkRole } = require("../middleware/jwt");
const databaseService = require("../Services/databaseService");
const logger = require("../config/logger");

const router = express.Router();

// Eksempel på login-rute
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res
        .status(401)
        .json({ error: info.message || "Invalid credentials" });
    }
    const token = generateToken(user);
    res.status(200).json({
      message: "Login successful",
      token: token,
      user: { username: user.username, role: user.role },
    });
  })(req, res, next);
});

router.get(
  "/auth/google",
  (req, res, next) => {
    logger.debug("Google OAuth login attempt");
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const token = generateToken(req.user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Always use secure for cross-domain
      sameSite: "none", // Required for cross-origin requests
      maxAge: 24 * 60 * 60 * 1000,
    });
    logger.info("Google OAuth login successful", {
      username: req.user.username,
    });
    res.redirect(`${process.env.FRONTEND_URL}/hjem`);
  }
);

router.get("/auth/check", verifyJWT, async (req, res) => {
  logger.debug("Auth check request", {
    user: req.user ? req.user._id : "unknown",
  });
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

router.post("/logout", verifyJWT, (req, res) => {
  logger.info("Logout attempt", { username: req.user.username });
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  logger.info("User logged out successfully", { username: req.user.username });
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
      secure: true, // Always use secure for cross-domain
      sameSite: "none", // Required for cross-origin requests
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

module.exports = router;
