const express = require("express");
const passport = require("../config/passport");
const user = require("../config/roles");
const databaseService = require("../Services/databaseService");

const router = express.Router();

/**
 * @swagger
 * /api/v1/:
 *   get:
 *     summary: Check if the server is running
 *     responses:
 *       200:
 *         description: Server is running
 */
router.get("/", (req, res) => {
  res.send("Server is running");
});

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: Log in a user
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
 *         description: Logged in
 *       401:
 *         description: Incorrect credentials
 */
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user)
      return res.status(401).json({ message: info?.message || "Unauthorized" });

    req.login(user, (err) => {
      if (err) return next(err);
      return res.json({ message: "Logged in successfully", user });
    });
  })(req, res, next);
});

/**
 * @swagger
 * /api/v1/admin:
 *   get:
 *     summary: Access the admin page
 *     responses:
 *       200:
 *         description: Welcome to the admin page
 *       403:
 *         description: Access Denied
 */
router.get("/admin", user.can("access admin page"), (req, res) => {
  res.send("Welcome to the admin page");
});

/**
 * @swagger
 * /api/v1/register:
 *   post:
 *     summary: Register a new user
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
 *       201:
 *         description: User created
 *       400:
 *         description: Error creating user
 */
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const newUser = await databaseService.createUser({ username, password });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users and their roles
 *     responses:
 *       200:
 *         description: A list of users and their roles
 *       500:
 *         description: Server error
 */
router.get("/users", async (req, res) => {
  try {
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
 *       403:
 *         description: Access Denied
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
 *     responses:
 *       200:
 *         description: User role
 *       401:
 *         description: Unauthorized
 */
router.get("/role", (req, res) => {
  try {
    console.log("Cookies:", req.cookies); // Debugging
    console.log("Session ID:", req.sessionID); // Debugging
    console.log("Session Data:", req.session); // Debugging
    console.log("User from session:", req.user); // Debugging

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No user logged in" });
    }

    res.json({ role: req.user.role });
  } catch (err) {
    console.error("Error fetching user role:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
