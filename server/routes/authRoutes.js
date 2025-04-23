const express = require("express");
const passport = require("../config/passport");
const user = require("../config/roles");
const databaseService = require("../Services/databaseService");

const router = express.Router();

const ensureSession = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication failed" });
  }
  next();
};

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res
        .status(401)
        .json({ error: info.message || "Invalid credentials" });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.status(200).json({
        message: "Login successful",
        user: { username: user.username, role: user.role },
      });
    });
  })(req, res, next);
});

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/auth/check", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const profile = await databaseService.getProfileWithMatches(req.user._id);
      res.status(200).json({
        isAuthenticated: true,
        user: profile,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(200).json({ isAuthenticated: false, user: null });
  }
});

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  ensureSession,
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/smashpadelcenter/hjem`);
  }
);

router.get("/users", async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No user logged in" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admins only" });
    }
    const users = await databaseService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/change-role", user.can("access admin page"), async (req, res) => {
  const { username, role } = req.body;
  try {
    const updatedUser = await databaseService.updateUserRole(username, role);
    res.status(200).json({ message: "Role updated", user: updatedUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/role", (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No user logged in" });
    }
    res.json({ role: req.user.role });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/username", (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No user logged in" });
    }
    res.status(200).json({ username: req.user.username });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
});

router.post("/register", async (req, res) => {
  try {
    const { username, password, email, fullName } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const existingUser = await databaseService.findUserByUsername(username);
    if (existingUser) {
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
    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.status(201).json({
        message: "Registration successful",
        user: { username: newUser.username, role: newUser.role },
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
