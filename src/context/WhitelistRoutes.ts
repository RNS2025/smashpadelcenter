// Routes that should NOT trigger a redirect even if the user is not authenticated
export const WHITELIST_ROUTES = [
  "/turneringer/check-in",
  "/player/:playerId/:rowId, /court-times",
  "/register",
  "/turneringer/baneoversigt",
  "/login",
  "/turneringer",
  "/turneringer/info",
  "/",
  "/player/:playerId/:rowId",
  "/player/:playerId",
  "/InstallPrompt",
];
