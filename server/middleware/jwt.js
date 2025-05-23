//  /jwt.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const verifyJWT = async (req, res, next) => {
  // Enhanced logging for debugging
  console.log("Headers:", req.headers);
  console.log("Cookies:", req.cookies);

  // Get token from cookie or Authorization header with more robust handling
  const token =
    (req.cookies && req.cookies.token) ||
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : req.headers.authorization);

  console.log("Token extracted:", token ? "Token exists" : "No token found");

  if (!token) {
    console.log("Authentication failed: No token provided");
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    console.log("Token decoded successfully:", decoded.id);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("Authentication failed: User not found for ID", decoded.id);
      return res.status(401).json({ error: "User not found" });
    }

    // Add user to request object
    req.user = user;
    console.log("User authenticated successfully:", user.username);

    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);

    // More detailed error handling
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.status(401).json({ error: "Authentication failed" });
  }
};

// Custom middleware for EventSource authentication (supports query parameters)
const verifyJWTForSSE = async (req, res, next) => {
  // Get token from query params, cookie, or Authorization header
  const token =
    req.query.token ||
    (req.cookies && req.cookies.token) ||
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : req.headers.authorization);

  console.log(
    "SSE Token extracted:",
    token ? "Token exists" : "No token found"
  );

  if (!token) {
    console.log("SSE Authentication failed: No token provided");
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    console.log("SSE Token decoded successfully:", decoded.id);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log(
        "SSE Authentication failed: User not found for ID",
        decoded.id
      );
      return res.status(401).json({ error: "User not found" });
    }

    // Add user to request object
    req.user = user;
    console.log("SSE User authenticated successfully:", user.username);

    next();
  } catch (err) {
    console.error("SSE JWT verification error:", err.message);

    // More detailed error handling
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.status(500).json({ error: "Authentication error" });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied - Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};

module.exports = { verifyJWT, verifyJWTForSSE, checkRole };
