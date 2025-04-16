const ConnectRoles = require("connect-roles");

const user = new ConnectRoles({
  failureHandler: function (req, res, action) {
    res.status(403).json({
      message: "Adgang nægtet - Du har ikke tilladelse til: " + action,
    });
  },
});

// Define roles
user.use("access protected", (req) => {
  if (req.user && (req.user.role === "user" || req.user.role === "admin")) {
    return true;
  }
});

user.use("access admin page", (req) => {
  if (req.user && req.user.role === "admin") {
    return true;
  }
});

module.exports = user;
