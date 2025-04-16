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
  path: "/socket.io/",
});

// Track online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join", async (username) => {
    try {
      if (!username || typeof username !== "string") {
        console.error(`Invalid username received in join event: ${username}`);
        return;
      }

      // Fetch user by username
      const User = require("./models/user");
      const user = await User.findOne({ username });
      if (!user) {
        console.error(`User not found for username: ${username}`);
        return;
      }
      const userId = user._id.toString();

      socket.join(userId);
      onlineUsers.set(username, socket.id);

      // Notify friends of online status
      const friends = await require("./models/Friend").find({
        $or: [{ userId }, { friendId: userId }],
        status: "accepted",
      });

      friends.forEach((friend) => {
        const friendId =
          friend.userId.toString() === userId
            ? friend.friendId.toString()
            : friend.userId.toString();
        io.to(friendId).emit("userStatus", { userId, status: "online" });
      });
    } catch (error) {
      console.error("Error in join event:", error);
    }
  });

  socket.on(
    "sendMessage",
    async ({ senderUsername, receiverUsername, content }) => {
      try {
        if (
          !senderUsername ||
          !receiverUsername ||
          typeof senderUsername !== "string" ||
          typeof receiverUsername !== "string"
        ) {
          console.error(
            `Invalid usernames in sendMessage: senderUsername=${senderUsername}, receiverUsername=${receiverUsername}`
          );
          return;
        }

        // Fetch sender and receiver by username
        const User = require("./models/user");
        const sender = await User.findOne({ username: senderUsername });
        const receiver = await User.findOne({ username: receiverUsername });
        if (!sender || !receiver) {
          console.error(
            `User not found: senderUsername=${senderUsername}, receiverUsername=${receiverUsername}`
          );
          return;
        }
        const senderId = sender._id.toString();
        const receiverId = receiver._id.toString();

        const message = await require("./models/Message").create({
          senderId,
          receiverId,
          content,
          isRead: false,
        });

        const populatedMessage = await require("./models/Message")
          .findById(message._id)
          .populate("senderId", "username")
          .populate("receiverId", "username");

        io.to(senderId).to(receiverId).emit("newMessage", populatedMessage);
      } catch (error) {
        console.error("Fejl ved afsendelse af besked:", error);
      }
    }
  );

  socket.on("joinMatchRoom", (matchId) => {
    socket.join(matchId);
    console.log(`Client ${socket.id} joined room ${matchId}`);
  });

  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    let disconnectedUsername;
    for (let [username, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUsername = username;
        onlineUsers.delete(username);
        break;
      }
    }

    if (disconnectedUsername) {
      try {
        // Fetch user by username
        const User = require("./models/user");
        const user = await User.findOne({ username: disconnectedUsername });
        if (!user) {
          console.error(`User not found for username: ${disconnectedUsername}`);
          return;
        }
        const userId = user._id.toString();

        const friends = await require("./models/Friend").find({
          $or: [{ userId }, { friendId: userId }],
          status: "accepted",
        });

        friends.forEach((friend) => {
          const friendId =
            friend.userId.toString() === userId
              ? friend.friendId.toString()
              : friend.userId.toString();
          io.to(friendId).emit("userStatus", {
            userId,
            status: "offline",
          });
        });
      } catch (error) {
        console.error("Error in disconnect event:", error);
      }
    }
  });
});

// Middleware
app.use(express.json());

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
app.use("/api/v1/user-profiles", userProfileRoutes);
app.use("/api/v1/friends", friendRoutes);
app.use("/api/v1/messages", messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Make io available
app.set("socketio", io);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Server is running", socketIo: !!io });
});

// MongoDB connection setup
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
