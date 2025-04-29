// Routes that should NOT trigger a redirect even if the user is not authenticated
export const WHITELIST_ROUTES = [
  "/turneringer/check-in",
  "/player/:playerId/:rowId, /court-times",
  "/register",
  "/turneringer/baneoversigt",
  "/login",
  "/turneringer",
  "/turneringer/info",
  "/turneringer/info/briefing",
  "/turneringer/info/generelt",
  "/",
  "/player/:playerId/:rowId",
  "/player/:playerId",
  "/InstallPrompt",
];
