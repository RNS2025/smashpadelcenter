const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("./config/passport").passport;
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
const privateEventRoutes = require("./routes/privateEventRoutes");
const briefingRoutes = require("./routes/briefingRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const { swaggerUi, specs } = require("./config/swagger");
const { connectDB, mongoose } = require("./config/database");
const createAdmin = require("./scripts/createAdmin");
const createTenUsers = require("./scripts/createTenUsers");
const { updateAllData } = require("./scripts/dataScheduler");
const { verifyJWT } = require("./middleware/jwt");
const path = require("path");
const http = require("http");
const dotenv = require("dotenv");
const logger = require("./config/logger");
const emailService = require("./Services/emailService");

// Load .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3001;
const ENV = process.env.NODE_ENV || "development";
const isDev = ENV === "development";

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true); // Allow any origin
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);

// Log all incoming requests
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Passport setup
app.use(passport.initialize());

if (isDev) {
  app.use((req, res, next) => {
    const delayMs = parseInt("2000", 10);
    logger.info(
      `Development mode: Adding ${delayMs}ms delay to simulate network latency`
    );
    setTimeout(next, delayMs);
  });
}

// Serve static files
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
app.use("/api/v1/private-event", privateEventRoutes);

app.use("/api/v1/briefing", briefingRoutes);
app.use("/api/v1/feedback", feedbackRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({ error: "Internal Server Error" });
});

// HTTP Server
const httpServer = http.createServer(app);

// MongoDB connection and server startup
async function startServer() {
  try {
    await connectDB();
    await createAdmin();
    await createTenUsers();

    // Verify email connection
    try {
      await emailService.verifyConnection();
    } catch (emailErr) {
      logger.warn(
        "Email service not available, continuing without email functionality"
      );
      // Don't fail server startup if email isn't configured
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`HTTP Server is running on http://localhost:${PORT}`);
      updateAllData();
    });
  } catch (err) {
    logger.error("Failed to start server:", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

startServer();

module.exports = app;
