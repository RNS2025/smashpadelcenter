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
const LigaRoutes = require("./routes/LigaRoutes");
const { swaggerUi, specs } = require("./config/swagger");
const mongoose = require("./config/database");
const createAdmin = require("./scripts/createAdmin");
const createTenUsers = require("./scripts/createTenUsers");
const { updateAllData } = require("./scripts/dataScheduler");
const { Server } = require("socket.io");
const path = require("path");
const http = require("http");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io/", // Explicitly set path
});

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.1.124:5173",
      "http://frontend:5173",
    ],
    credentials: true,
  })
);

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Connect-Roles setup
app.use(user.middleware());

// Serve static files from the 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: "Something went wrong!" });
});

// Socket.io setup
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinMatchRoom", (matchId) => {
    socket.join(matchId);
    console.log(`Client ${socket.id} joined room ${matchId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io available to routes
app.set("socketio", io);

// Health check endpoint for debugging
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Server is running", socketIo: !!io });
});

mongoose.connection.once("open", async () => {
  console.log("✅ Connected to MongoDB");
  await createAdmin();
  await createTenUsers();
  server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    // Start the scheduler
    updateAllData(); // Optional: Run immediately on startup
  });
});
