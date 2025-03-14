const ConnectRoles = require("connect-roles");

const user = new ConnectRoles({
  failureHandler: function (req, res, action) {
    res.status(403).json({
      message: "Access Denied - You don't have permission to: " + action,
    });
  },
});

// Define roles
user.use("access admin page", (req) => {
  if (req.user && req.user.role === "admin") {
    return true;
  }
});

user.use("access user page", (req) => {
  if (req.user && req.user.role === "user") {
    return true;
  }
});

module.exports = user;
