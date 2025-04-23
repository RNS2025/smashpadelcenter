const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const user = require("./config/roles");
const authRoutes = require("./routes/authRoutes");
const rankedInRoutes = require("./routes/rankedinRoutes");
const checkInRoutes = require("./routes/check-inRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const bookingSystemRoutes = require("./routes/bookingSystemRoutes");
const trainerRoutes = require("./routes/bookTrainersRoutes");
const smashEventRoutes = require("./routes/smashEventRoutes");
const newsRoutes = require("./routes/newsRoutes");
const padelMatchesRoutes = require("./routes/padelMatchesRoutes");
const userProfileRoutes = require("./routes/userProfileRoutes");
const LigaRoutes = require("./routes/LigaRoutes");
const friendRoutes = require("./routes/friendRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { swaggerUi, specs } = require("./config/swagger");
const mongoose = require("./config/database");
const createAdmin = require("./scripts/createAdmin");
const createTenUsers = require("./scripts/createTenUsers");
const { updateAllData } = require("./scripts/dataScheduler");
const path = require("path");
const https = require("https");
const fs = require("fs");
const { setupSocketIO } = require("./WebSockets");
const { setIO } = require("./Services/trainerService");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const ENV = "development";

// Middleware
app.use(express.json());

// Load SSL certificates (for local development or production with self-managed certs)
let server;
if (ENV === "production") {
  // In production, rely on hosting platform (e.g., Heroku, AWS) or load certs
  // Example for self-managed certificates:
  const privateKey = fs.readFileSync("/path/to/privkey.pem", "utf8");
  const certificate = fs.readFileSync("/path/to/cert.pem", "utf8");
  const ca = fs.readFileSync("/path/to/chain.pem", "utf8"); // Optional: CA bundle
  const credentials = { key: privateKey, cert: certificate, ca: ca };
  server = https.createServer(credentials, app);
} else {
  // Local development with self-signed certificates
  const privateKey = fs.readFileSync("certs/server.key", "utf8");
  const certificate = fs.readFileSync("certs/server.cert", "utf8");
  const credentials = { key: privateKey, cert: certificate };
  server = https.createServer(credentials, app);
}

// Setup Socket.IO with the HTTPS server
const io = setupSocketIO(server);
setIO(io);

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://localhost:5173",
      "http://192.168.1.124:5173",
      "http://frontend:5173",
      "https://rns2025.github.io", // Ensure HTTPS for GitHub Pages
    ],
    credentials: true,
  })
);

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: true,
    saveUninitialized: true,
    rolling: true,
    cookie: {
      secure: true, // Must be true for HTTPS to ensure cookies are sent
      httpOnly: true,
      sameSite: "none", // Required for cross-origin requests with HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Connect-Roles setup
app.use(user.middleware());

// Serve static files from the 'Uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

// Swagger setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use("/api/v1", authRoutes);
app.use("/api/v1", rankedInRoutes);
app.use("/api/v1", checkInRoutes);
app.use("/api/v1", subscriptionRoutes);
app.use("/api/v1", bookingSystemRoutes);
app.use("/api/v1", trainerRoutes);
app.use("/api/v1", smashEventRoutes);
app.use("/api/v1", newsRoutes);
app.use("/api/v1/matches", padelMatchesRoutes);
app.use("/api/v1/liga", LigaRoutes);
app.use("/api/v1/user-profiles", userProfileRoutes);
app.use("/api/v1/friends", friendRoutes);
app.use("/api/v1/messages", messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Make io available to routes
app.set("socketio", io);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Server is running", socketIo: !!io });
});

// Clean database function
const cleanDatabase = async () => {
  try {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.drop();
      console.log(`🗑️ Dropped collection: ${collection.collectionName}`);
    }
    console.log("✅ Database wiped successfully");
  } catch (error) {
    console.error("Error wiping database:", error);
  }
};

// MongoDB connection setup
mongoose.connection.once("open", async () => {
  console.log("✅ Connected to MongoDB");

  // await cleanDatabase();

  // Recreate admin and test users after potential wipe
  await createAdmin();
  await createTenUsers();

  server.listen(PORT, () => {
    console.log(`🚀 Server is running on https://localhost:${PORT}`);
    // Start the scheduler
    updateAllData(); // Optional: Run immediately on startup
  });
});
