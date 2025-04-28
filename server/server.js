const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
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
const { connectDB, mongoose } = require("./config/database");
const createAdmin = require("./scripts/createAdmin");
const createTenUsers = require("./scripts/createTenUsers");
const { updateAllData } = require("./scripts/dataScheduler");
const privateEventRoutes = require("./routes/privateEventRoutes");
const path = require("path");
const https = require("https");
const http = require("http");
const fs = require("fs");
const { setupSocketIO } = require("./WebSockets");
const dotenv = require("dotenv");
const logger = require("./config/logger");

// Load .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3001;
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const ENV = process.env.NODE_ENV || "development";
const SESSION_SECRET = process.env.SESSION_SECRET || "default_secret_key";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/smashpadel";

// Middleware
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Load SSL certificates
let httpsServer;
let httpServer = http.createServer(app);
if (ENV === "production") {
  const privateKey = fs.readFileSync("/path/to/privkey.pem", "utf8");
  const certificate = fs.readFileSync("/path/to/cert.pem", "utf8");
  const ca = fs.readFileSync("/path/to/chain.pem", "utf8");
  const credentials = { key: privateKey, cert: certificate, ca: ca };
  httpsServer = https.createServer(credentials, app);
} else {
  const privateKey = fs.readFileSync("certs/server.key", "utf8");
  const certificate = fs.readFileSync("certs/server.cert", "utf8");
  const credentials = { key: privateKey, cert: certificate };
  httpsServer = https.createServer(credentials, app);
}

// Setup Socket.IO (use HTTPS server for Socket.IO)
const io = setupSocketIO(httpsServer);

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "https://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Session setup with MongoDB store
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: "sessions",
      ttl: 365 * 24 * 60 * 60,
      autoRemove: "interval",
      autoRemoveInterval: 10,
    }),
    cookie: {
      secure: ENV === "production" ? true : false,
      httpOnly: true,
      sameSite: ENV === "production" ? "none" : "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: "/",
    },
    rolling: true,
  })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Connect-Roles setup
app.use(user.middleware());

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
    httpServer.listen(HTTP_PORT, () => {
      logger.info(`HTTP Server is running on http://localhost:${HTTP_PORT}`);
    });

    // Start HTTPS server
    httpsServer.listen(PORT, () => {
      logger.info(`HTTPS Server is running on https://localhost:${PORT}`);
      updateAllData();
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
