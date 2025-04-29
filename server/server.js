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
const { swaggerUi, specs } = require("./config/swagger");
const { connectDB, mongoose } = require("./config/database");
const createAdmin = require("./scripts/createAdmin");
const createTenUsers = require("./scripts/createTenUsers");
const { updateAllData } = require("./scripts/dataScheduler");
const { verifyJWT } = require("./middleware/jwt");
const path = require("path");
const http = require("http");
const { setupSocketIO } = require("./WebSockets");
const dotenv = require("dotenv");
const logger = require("./config/logger");

// Load .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3001;
const ENV = process.env.NODE_ENV || "development";
const isDev = ENV === "development";

// Log which environment and database we're using
logger.info(`Using ${isDev ? "development" : "production"} database`);

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

// HTTP Server and Socket.IO setup
const httpServer = http.createServer(app);
const io = setupSocketIO(httpServer);
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
      logger.info(`🗑️ Dropped collection: ${collection.collectionName}`);
    }
    logger.info("✅ Database wiped successfully");
  } catch (error) {
    logger.error("Error wiping database:", {
      error: error.message,
      stack: error.stack,
    });
  }
};

// MongoDB connection and server startup
async function startServer() {
  try {
    await connectDB();
    //await cleanDatabase();
    await createAdmin();
    await createTenUsers();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`HTTP Server is running on http://localhost:${PORT}`);
      updateAllData();
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
