const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const user = require("./config/roles");
const mainRoutes = require("./routes/routes");
const { swaggerUi, specs } = require("./config/swagger");
const mongoose = require("./config/database"); 
const createAdmin = require("./scripts/createAdmin");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// CORS configuration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Needed for cross-origin cookies
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
app.use("/api/v1", mainRoutes);

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

  // Start the server
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
});
