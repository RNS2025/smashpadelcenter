const ConnectRoles = require("connect-roles");

const user = new ConnectRoles({
  failureHandler: function (req, res, action) {
    res.status(403).json({
      message: "Adgang nægtet - Du har ikke tilladelse til: " + action,
    });
  },
});

user.use("access admin page", (req) => {
  if (req.user && req.user.role === "admin") {
    return true;
  }
});

// Define a new role for trainers
user.use("access trainer page", (req) => {
  if (req.user && req.user.role === "trainer") {
    return true;
  }
});

// Update the "access protected" role to include trainers as well
user.use("access protected", (req) => {
  if (
    req.user &&
    (req.user.role === "user" ||
      req.user.role === "admin" ||
      req.user.role === "trainer")
  ) {
    return true;
  }
});

module.exports = user;
