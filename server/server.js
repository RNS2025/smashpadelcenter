const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("./config/passport").passport;
const authRoutes = require("./routes/authRoutes");
const rankedInRoutes = require("./routes/rankedinRoutes");
const checkInRoutes = require("./routes/check-inRoutes");
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
const { connectDB } = require("./config/database");
const createAdmin = require("./scripts/createAdmin");
const createTenUsers = require("./scripts/createTenUsers");
const {
  updateAllData,
  checkAndNotifyAboutTournaments,
} = require("./scripts/dataScheduler");
const { verifyJWT } = require("./middleware/jwt");
const notificationRoutes = require("./routes/notificationRoutes");
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

// Handle OPTIONS requests directly to prevent redirects on preflight requests
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3001",
    "http://localhost:5173", 
    "https://rns-apps.dk",
    "https://www.rns-apps.dk",
    "http://rns-apps.dk", 
    "http://www.rns-apps.dk"
  ];

  if (origin && (allowedOrigins.includes(origin) || origin.match(/^https?:\/\/.*\.rns-apps\.dk$/))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.status(200).end();
});

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        "http://localhost:3001",
        "http://localhost:5173",
        "https://rns-apps.dk",
        "https://www.rns-apps.dk",
        "http://rns-apps.dk",
        "http://www.rns-apps.dk",
      ];

      // Check if the origin is allowed
      if (
        allowedOrigins.includes(origin) ||
        origin.match(/^https?:\/\/.*\.rns-apps\.dk$/)
      ) {
        return callback(null, origin);  // Return the origin instead of true
      }

      // Log unexpected origins for debugging
      console.log(`CORS request from unauthorized origin: ${origin}`);
      callback(null, true); // Still allow for now to prevent breaking changes
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Cache-Control",
    ],
    exposedHeaders: ["Access-Control-Allow-Origin"],
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

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

// Swagger setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use("/api/v1", authRoutes);
app.use("/api/v1", rankedInRoutes);
app.use("/api/v1", checkInRoutes);
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
app.use("/api/v1/notifications", notificationRoutes);

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
    } // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`HTTP Server is running on http://localhost:${PORT}`);
      updateAllData();

      // Run the tournament notification check once at startup
      // This helps ensure users get notifications even after server restarts
      logger.info("Running initial tournament notification check");
      checkAndNotifyAboutTournaments();
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
