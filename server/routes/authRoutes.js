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

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: Log in with username and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
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

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth
 */
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// routes/authRoutes.js
/**
 * @swagger
 * /api/v1/auth/check:
 *   get:
 *     summary: Check if user is authenticated
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Authentication status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAuthenticated:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     provider:
 *                       type: string
 */
router.get("/auth/check", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({
      isAuthenticated: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        provider: req.user.provider,
      },
    });
  } else {
    res.status(200).json({ isAuthenticated: false, user: null });
  }
});

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to frontend
 */
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  ensureSession,
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/smashpadelcenter/hjem`);
  }
);

/**
 * @swagger
 * /api/v1/auth/facebook:
 *   get:
 *     summary: Initiate Facebook OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Facebook OAuth
 */
router.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

/**
 * @swagger
 * /api/v1/auth/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to frontend
 */
router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  ensureSession,
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/hjem`);
  }
);

/**
 * @swagger
 * /api/v1/auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to GitHub OAuth
 */
router.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

/**
 * @swagger
 * /api/v1/auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to frontend
 */
router.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  ensureSession,
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/hjem`);
  }
);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users and their roles (Admin only)
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: A list of users and their roles
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /api/v1/change-role:
 *   post:
 *     summary: Change the role of a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated
 *       400:
 *         description: Error updating role
 */
router.post("/change-role", user.can("access admin page"), async (req, res) => {
  const { username, role } = req.body;
  try {
    const updatedUser = await databaseService.updateUserRole(username, role);
    res.status(200).json({ message: "Role updated", user: updatedUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/role:
 *   get:
 *     summary: Get the role of the logged-in user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User role
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /api/v1/username:
 *   get:
 *     summary: Get the username of the logged-in user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Username
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /api/v1/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       500:
 *         description: Internal Server Error
 */
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

/**
 * @swagger
 * /api/v1/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input or user already exists
 *       500:
 *         description: Server error
 */
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await databaseService.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already in use" });
    }

    // Create new user with default role
    const newUser = await databaseService.createUser({
      username,
      password,
      role: "user",
      provider: "local",
    });

    // Auto-login after registration
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
