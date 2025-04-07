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
const { swaggerUi, specs } = require("./config/swagger");
const mongoose = require("./config/database");
const createAdmin = require("./scripts/createAdmin");
const createTenUsers = require("./scripts/createTenUsers");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: "Something went wrong!" });
});

// Wait for MongoDB to connect before starting the server
mongoose.connection.once("open", async () => {
  console.log("✅ Connected to MongoDB");

  // Ensure the admin user exists
  await createAdmin();

  // Ensure the ten users exist
  await createTenUsers();

  // Start the server
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
});
