const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user");
const argon2 = require("argon2");

passport.use(
  new LocalStrategy(async function (username, password, done) {
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }

      // Use argon2 to verify the password
      const isMatch = await argon2.verify(user.password, password);
      if (!isMatch) {
        return done(null, false, { message: "Incorrect password." });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
