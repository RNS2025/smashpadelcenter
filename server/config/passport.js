const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

passport.use(
  new LocalStrategy(async function (username, password, done) {
    try {
      const user = await User.findOne({ username, provider: "local" });
      if (!user) {
        return done(null, false, {
          message: "Forkert brugernavn eller adgangskode.",
        });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return done(null, false, { message: "Forkert adgangskode." });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// Instead, create a function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "1d" }
  );
};

module.exports = { passport, generateToken };
