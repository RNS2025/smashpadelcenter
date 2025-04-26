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
const { connectDB } = require("./config/database");
const createAdmin = require("./scripts/createAdmin");
const createTenUsers = require("./scripts/createTenUsers");
const { updateAllData } = require("./scripts/dataScheduler");
const privateEventRoutes = require("./routes/privateEventRoutes");
const path = require("path");
const https = require("https");
const fs = require("fs");
const { setupSocketIO } = require("./WebSockets");
const { setIO } = require("./Services/trainerService");
const dotenv = require("dotenv");
const { mongoose } = require("./config/database");
const logger = require("./config/logger");

// Load .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3001;
const ENV = process.env.NODE_ENV || "development";
const SESSION_SECRET = process.env.SESSION_SECRET || "default_secret_key";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/smashpadel";

// Middleware
app.use(express.json());

// Load SSL certificates
let server;
if (ENV === "production") {
  const privateKey = fs.readFileSync("/path/to/privkey.pem", "utf8");
  const certificate = fs.readFileSync("/path/to/cert.pem", "utf8");
  const ca = fs.readFileSync("/path/to/chain.pem", "utf8");
  const credentials = { key: privateKey, cert: certificate, ca: ca };
  server = https.createServer(credentials, app);
} else {
  const privateKey = fs.readFileSync("certs/server.key", "utf8");
  const certificate = fs.readFileSync("certs/server.cert", "utf8");
  const credentials = { key: privateKey, cert: certificate };
  server = https.createServer(credentials, app);
}

// Setup Socket.IO
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
      "https://rns2025.github.io",
    ],
    credentials: true, // Allow cookies and credentials
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Session setup with MongoDB store
// app.js
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: "sessions",
      ttl: 365 * 24 * 60 * 60, // 1 year
      autoRemove: "interval",
      autoRemoveInterval: 10, // Remove expired sessions every 10 minutes
    }),
    cookie: {
      secure: ENV === "production" ? true : false, // Use secure cookies in production
      httpOnly: true,
      sameSite: ENV === "production" ? "none" : "lax", // Use 'none' for cross-site in production
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      path: "/", // Ensure cookie is available for all routes
    },
    rolling: true, // Refresh session on each request
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
      console.log(`🗑️ Dropped collection: ${collection.collectionName}`);
    }
    console.log("✅ Database wiped successfully");
  } catch (error) {
    console.error("Error wiping database:", error);
  }
};

// MongoDB connection and server startup
async function startServer() {
  try {
    await connectDB();
    //await cleanDatabase(); // Uncomment this line to wipe the database
    await createAdmin();
    await createTenUsers();
    server.listen(PORT, () => {
      logger.info(`Server is running on https://localhost:${PORT}`);
      updateAllData();
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
